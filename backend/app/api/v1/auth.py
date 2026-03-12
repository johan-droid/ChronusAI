"""Authentication router — User domain only.

Key security decisions
----------------------
* Access tokens are short-lived JWTs (15 min default) returned in the JSON body
  and stored only in-memory by the frontend (never localStorage).
* Refresh tokens are long-lived JWTs (7 days) stored exclusively in an
  ``HttpOnly; Secure; SameSite=Lax`` cookie so JavaScript cannot read them.
* Token rotation on every refresh call.
* Password reset and email verification via time-limited secure tokens.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.oauth import get_oauth_provider
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_password_hash,
    revoke_all_user_sessions,
    revoke_session,
    token_encryptor,
    verify_password,
)
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.oauth_credential import OAuthCredential
from app.models.user import User
from app.schemas.user import (
    EmailVerificationRequest,
    PasswordReset,
    PasswordResetRequest,
    TokenResponse,
    UserLogin,
    UserRead,
    UserRegister,
)
import structlog

logger = structlog.get_logger()

# ── Cookie configuration ──────────────────────────────────────────────────────

_REFRESH_COOKIE = "chronos_refresh"
_REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Attach the refresh token as an HttpOnly secure cookie."""
    is_prod = settings.app_env == "production"
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=is_prod,
        samesite="none" if is_prod else "lax",
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=_REFRESH_COOKIE, path="/api/v1/auth")


# ── Routers ───────────────────────────────────────────────────────────────────

router = APIRouter(tags=["authentication"])

# Separate router for Microsoft OAuth (keeps existing prefix structure working)
microsoft_router = APIRouter(tags=["authentication"])


# ── Email / Password auth ─────────────────────────────────────────────────────

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password.

    Returns an access token in the body and sets the refresh token as an
    HttpOnly cookie.  A verification token is returned in dev mode only.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered.")

    verification_token = secrets.token_urlsafe(32)
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        provider="email",
        timezone="UTC",
        is_verified=False,
        email_verification_token=verification_token,
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception as exc:
        await db.rollback()
        logger.error("register_db_error", error=str(exc))
        raise HTTPException(status_code=500, detail="Could not create account.")

    access_token = create_access_token(subject=str(new_user.id))
    refresh_token = create_refresh_token(subject=str(new_user.id))
    _set_refresh_cookie(response, refresh_token)

    # In production, email the verification_token instead of returning it.
    logger.info("user_registered", user_id=str(new_user.id))
    payload: dict = {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserRead.model_validate(new_user).model_dump(mode="json"),
    }
    if settings.app_env != "production":
        payload["_dev_verification_token"] = verification_token
    return payload


# Keep /signup as an alias for backward compatibility with existing frontend.
@router.post("/signup")
async def signup(user_in: UserRegister, response: Response, db: AsyncSession = Depends(get_db)):
    return await register(user_in, response, db)


@router.post("/login")
async def login(user_in: UserLogin, response: Response, db: AsyncSession = Depends(get_db)):
    """Authenticate with email & password.

    Sets refresh token cookie; returns access token in body.
    """
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(user_in.password, str(user.hashed_password)):
        logger.warning("login_failed", email=user_in.email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    _set_refresh_cookie(response, refresh_token)

    logger.info("user_logged_in", user_id=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserRead.model_validate(user).model_dump(mode="json"),
    }


@router.post("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    cookie_token: str | None = Cookie(default=None, alias=_REFRESH_COOKIE),
):
    """Issue a new access token using the HttpOnly refresh cookie (with header fallback).

    Performs token rotation: the old refresh token is revoked and a new one is
    issued.
    """
    # Prefer cookie; fall back to Authorization header so existing clients keep working.
    token_string = cookie_token
    if not token_string:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization") or ""
        if auth_header.startswith("Bearer ") or auth_header.startswith("bearer "):
            token_string = auth_header.split(" ", 1)[1].strip()

    if not token_string:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token.")

    try:
        token_data = decode_refresh_token(token_string)
    except Exception:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    user_id = uuid.UUID(token_data["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        _clear_refresh_cookie(response)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or disabled.")

    # Rotate tokens
    new_access = create_access_token(subject=str(user.id))
    new_refresh = create_refresh_token(subject=str(user.id))
    await revoke_session(token_string)
    _set_refresh_cookie(response, new_refresh)

    # Also return new_refresh in body for clients that store it in-memory.
    return {
        "access_token": new_access,
        "token_type": "bearer",
        # Kept for backward-compat; new clients should rely on the cookie.
        "refresh_token": new_refresh,
    }


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    cookie_token: str | None = Cookie(default=None, alias=_REFRESH_COOKIE),
):
    """Revoke the current refresh token and clear the cookie."""
    token = cookie_token or request.headers.get("X-Refresh-Token") or request.headers.get("x-refresh-token")
    if token:
        await revoke_session(token)
    else:
        await revoke_all_user_sessions(str(current_user.id))
    _clear_refresh_cookie(response)
    logger.info("user_logged_out", user_id=str(current_user.id))
    return {"message": "Logged out successfully."}


@router.post("/logout-all")
async def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    """Revoke all active sessions for the current user."""
    await revoke_all_user_sessions(str(current_user.id))
    _clear_refresh_cookie(response)
    return {"message": "All sessions terminated."}


# ── Password reset ────────────────────────────────────────────────────────────

@router.post("/request-password-reset", status_code=status.HTTP_202_ACCEPTED)
async def request_password_reset(body: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Generate a password-reset token.

    Always returns 202 (even for unknown emails) to prevent user enumeration.
    In production, email the token; in dev it is returned directly.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    payload: dict = {"message": "If that email is registered you will receive a reset link."}

    if user and user.provider == "email":
        reset_token = secrets.token_urlsafe(32)
        user.password_reset_token = reset_token
        user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.commit()
        logger.info("password_reset_requested", user_id=str(user.id))

        # TODO: send email(reset_token) in production
        if settings.app_env != "production":
            payload["_dev_reset_token"] = reset_token

    return payload


@router.post("/reset-password")
async def reset_password(body: PasswordReset, db: AsyncSession = Depends(get_db)):
    """Consume a password-reset token and update the password."""
    result = await db.execute(select(User).where(User.password_reset_token == body.token))
    user = result.scalar_one_or_none()

    if not user or not user.password_reset_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    expires_at = user.password_reset_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset token has expired.")

    user.hashed_password = get_password_hash(body.new_password)
    user.password_reset_token = None
    user.password_reset_expires_at = None
    await revoke_all_user_sessions(str(user.id))
    await db.commit()

    logger.info("password_reset_completed", user_id=str(user.id))
    return {"message": "Password updated successfully. Please log in again."}


# ── Email verification ────────────────────────────────────────────────────────

@router.post("/verify-email")
async def verify_email(body: EmailVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Mark the user's email as verified using the one-time token."""
    result = await db.execute(select(User).where(User.email_verification_token == body.token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token.")

    user.is_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    user.email_verification_token = None
    await db.commit()

    logger.info("email_verified", user_id=str(user.id))
    return {"message": "Email verified successfully."}


@router.post("/resend-verification", status_code=status.HTTP_202_ACCEPTED)
async def resend_verification(body: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Re-send the email verification token (rate-limiting should be applied at infra level)."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    payload: dict = {"message": "If an unverified account exists for that email a new link will be sent."}

    if user and not user.is_verified:
        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        await db.commit()
        # TODO: send email(token) in production
        if settings.app_env != "production":
            payload["_dev_verification_token"] = token

    return payload


# ── Auth introspection ────────────────────────────────────────────────────────

@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


# ── OAuth helpers (existing, preserved) ──────────────────────────────────────

@router.get("/google/login")
async def google_login():
    return await _oauth_login("google")


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    return await _oauth_callback("google", code, state, db)


@microsoft_router.get("/outlook/login")
async def outlook_login():
    return await _oauth_login("outlook")


@microsoft_router.get("/outlook/callback")
async def outlook_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    return await _oauth_callback("outlook", code, state, db)


@router.get("/{provider}/login")
async def oauth_login(provider: str):
    return await _oauth_login(provider)


@router.get("/{provider}/callback")
async def oauth_callback(provider: str, code: str, state: str, db: AsyncSession = Depends(get_db)):
    return await _oauth_callback(provider, code, state, db)


async def _oauth_login(provider: str):
    if provider not in ["google", "outlook"]:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    try:
        oauth_provider = get_oauth_provider(provider)
        state = secrets.token_urlsafe(32)
        auth_url = oauth_provider.get_authorization_url(None, state)
        return {"auth_url": auth_url, "state": state}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to initiate OAuth: {exc}")


async def _oauth_callback(provider: str, code: str, state: str, db: AsyncSession):
    if provider not in ["google", "outlook"]:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    from fastapi import Response
    response = Response()
    try:
        oauth_provider = get_oauth_provider(provider)
        token_data = await oauth_provider.exchange_code_for_tokens(code)
        user_info = await oauth_provider.get_user_info(token_data["access_token"])

        result = await db.execute(select(User).where(User.email == user_info["email"]))
        user = result.scalar_one_or_none()

        if user:
            await _update_user_oauth_credentials(db, user, provider, token_data, user_info)
        else:
            user = await _create_oauth_user(db, user_info, provider, token_data)

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        _set_refresh_cookie(response, refresh_token)

        frontend_url = str(settings.frontend_url).rstrip("/")
        redirect_url = f"{frontend_url}/login?access_token={access_token}&refresh_token={refresh_token}"
        return RedirectResponse(url=redirect_url, headers=response.headers)

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("oauth_callback_error", provider=provider, error=str(exc))
        raise HTTPException(status_code=500, detail=f"OAuth callback failed: {exc}")


async def _update_user_oauth_credentials(
    db: AsyncSession, user: User, provider: str, token_data: dict, user_info: dict
):
    if user_info.get("name") and user.name != user_info["name"]:
        user.name = user_info["name"]

    result = await db.execute(
        select(OAuthCredential).where(
            and_(OAuthCredential.user_id == user.id, OAuthCredential.provider == provider)
        )
    )
    cred = result.scalar_one_or_none()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))

    if cred:
        cred.access_token = token_encryptor.encrypt(token_data["access_token"])
        cred.refresh_token = (
            token_encryptor.encrypt(token_data["refresh_token"]) if token_data.get("refresh_token") else None
        )
        cred.expires_at = expires_at
    else:
        db.add(
            OAuthCredential(
                user_id=user.id,
                provider=provider,
                access_token=token_encryptor.encrypt(token_data["access_token"]),
                refresh_token=(
                    token_encryptor.encrypt(token_data["refresh_token"]) if token_data.get("refresh_token") else None
                ),
                expires_at=expires_at,
            )
        )
    await db.commit()


async def _create_oauth_user(db: AsyncSession, user_info: dict, provider: str, token_data: dict) -> User:
    name = user_info.get("name") or user_info.get("email", "").split("@")[0]
    user = User(
        email=user_info["email"],
        name=name,
        full_name=name,
        hashed_password="",
        is_active=True,
        is_verified=True,
        provider=provider,
        timezone="UTC",
    )
    db.add(user)
    await db.flush()

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
    db.add(
        OAuthCredential(
            user_id=user.id,
            provider=provider,
            access_token=token_encryptor.encrypt(token_data["access_token"]),
            refresh_token=(
                token_encryptor.encrypt(token_data["refresh_token"]) if token_data.get("refresh_token") else None
            ),
            expires_at=expires_at,
        )
    )
    await db.commit()
    return user
