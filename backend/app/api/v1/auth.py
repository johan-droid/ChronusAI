from __future__ import annotations

import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.oauth import get_oauth_provider
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.core.security import (
    create_access_token, 
    token_encryptor, 
    create_refresh_token, 
    decode_refresh_token, 
    revoke_session,
    revoke_all_user_sessions, 
    get_password_hash,
    verify_password
)
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.oauth_credential import OAuthCredential
from app.models.user import User
from app.core.zoom import ZoomOAuth
import structlog

logger = structlog.get_logger()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str | None = None
    name: str | None = None

router = APIRouter(tags=["authentication"])

@router.post("/signup")
async def signup(user_in: UserSignup, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    # Check if user already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        logger.warning("signup_failed_user_exists", email=user_in.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    
    # Create new user
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        name=user_in.name or user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        provider="email",
        timezone="UTC"
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
    except Exception as e:
        await db.rollback()
        logger.error("Failed to create user", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create user account"
        )
    
    # Create tokens
    access_token = create_access_token(subject=str(new_user.id))
    refresh_token = create_refresh_token(subject=str(new_user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(new_user.id),
            "email": new_user.email,
            "full_name": new_user.full_name,
            "name": new_user.name
        }
    }

@router.post("/login")
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate user with email and password."""
    result = await db.execute(select(User).where(User.email == user_in.email))
    user = result.scalar_one_or_none()
    
    if not user or not user.hashed_password or not verify_password(user_in.password, user.hashed_password):
        logger.warning("login_failed_invalid_credentials", email=user_in.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    
    # Create tokens
    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "name": user.name
        }
    }

# Separate route for Microsoft OAuth with /api/v1 prefix
microsoft_router = APIRouter(tags=["authentication"])


@router.get("/google/login")
async def google_login():
    """Initiate Google OAuth flow."""
    return await oauth_login("google")


@router.get("/google/callback")
async def google_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Google OAuth callback."""
    return await oauth_callback("google", code, state, db)


@microsoft_router.get("/outlook/login")
async def outlook_login():
    """Initiate Microsoft OAuth flow."""
    return await oauth_login("outlook")


@microsoft_router.get("/outlook/callback")
async def outlook_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle Microsoft OAuth callback."""
    return await oauth_callback("outlook", code, state, db)


@router.get("/{provider}/login")
async def oauth_login(provider: str):
    """Initiate OAuth flow for the specified provider."""
    if provider not in ["google", "outlook"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported provider"
        )
    
    try:
        oauth_provider = get_oauth_provider(provider)
        state = secrets.token_urlsafe(32)
        
        # Use client_secret flow (no PKCE)
        auth_url = oauth_provider.get_authorization_url(None, state)
        
        return {"auth_url": auth_url, "state": state}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate OAuth: {str(e)}"
        )


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db),
):
    """Handle OAuth callback from provider with enhanced security and error handling."""
    try:
        # Debug logging
        safe_state = str(state) if state else ""
        logger.info("OAuth callback received", provider=provider, state=safe_state[0:10] + "...", code_length=len(code))



        
        # Validate provider
        if provider not in ["google", "outlook"]:
            logger.error("Unsupported provider in callback", provider=provider)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported provider"
            )
        
        # Validate code parameter
        if not code or len(code) < 10:
            logger.error("Invalid authorization code", code_length=len(code) if code else 0)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authorization code"
            )
        
        # Get OAuth provider
        oauth_provider = get_oauth_provider(provider)
        
        # Exchange authorization code for tokens
        try:
            token_data = await oauth_provider.exchange_code_for_tokens(code)
            logger.info("Successfully exchanged code for tokens", provider=provider)
        except Exception as e:
            logger.error("Failed to exchange code for tokens", provider=provider, error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange authorization code: {str(e)}"
            )
        
        # Get user info from provider
        try:
            user_info = await oauth_provider.get_user_info(token_data["access_token"])
            logger.info("Successfully retrieved user info", provider=provider, email=user_info.get("email"))
        except Exception as e:
            logger.error("Failed to get user info", provider=provider, error=str(e))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to retrieve user information: {str(e)}"
            )
        
        # Check if user exists
        result = await db.execute(
            select(User).where(User.email == user_info["email"])
        )
        user = result.scalar_one_or_none()
        
        if user:
            # Update existing user's OAuth credentials
            await update_user_oauth_credentials(db, user, provider, token_data, user_info)
            logger.info("Updated existing user OAuth credentials", user_id=user.id, provider=provider)
        else:
            # Create new user
            user = await create_new_user(db, user_info, provider, token_data)
            logger.info("Created new user", user_id=user.id, provider=provider)
        
        # Create access and refresh tokens
        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        
        # Redirect to frontend with tokens

        frontend_url = str(settings.frontend_url)
        redirect_url = f"{frontend_url}/login?access_token={access_token}&refresh_token={refresh_token}"
        
        logger.info("OAuth callback completed successfully", provider=provider, user_id=user.id)
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error in OAuth callback", provider=provider, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


async def update_user_oauth_credentials(db: AsyncSession, user: User, provider: str, token_data: dict, user_info: dict):
    """Update existing user's OAuth credentials."""
    # Update user info if needed
    if user_info.get("name") and user.name != user_info["name"]:
        user.name = user_info["name"]
    
    # Update or create OAuth credentials
    result = await db.execute(
        select(OAuthCredential).where(
            and_(
                OAuthCredential.user_id == user.id,
                OAuthCredential.provider == provider
            )
        )
    )
    oauth_credential = result.scalar_one_or_none()
    
    if oauth_credential:
        # Update existing credential (encrypt tokens for secure storage)
        oauth_credential.access_token = token_encryptor.encrypt(token_data["access_token"])
        oauth_credential.refresh_token = token_encryptor.encrypt(token_data["refresh_token"]) if token_data.get("refresh_token") else None
        oauth_credential.expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
    else:
        # Create new credential
        oauth_credential = OAuthCredential(
            user_id=user.id,
            provider=provider,
            access_token=token_encryptor.encrypt(token_data["access_token"]),
            refresh_token=token_encryptor.encrypt(token_data["refresh_token"]) if token_data.get("refresh_token") else None,
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
        )
        db.add(oauth_credential)
    
    await db.commit()


async def create_new_user(db: AsyncSession, user_info: dict, provider: str, token_data: dict) -> User:
    """Create a new user with OAuth credentials."""
    name = user_info.get("name") or user_info.get("email", "").split("@")[0] or ""
    user = User(
        email=user_info["email"],
        name=name,
        full_name=name,
        hashed_password="",  # OAuth users don't have passwords
        is_active=True,
        is_verified=True,
        provider=provider,
        timezone="UTC",
    )
    db.add(user)
    await db.flush()  # Get the user ID
    
    # Create OAuth credentials
    oauth_credential = OAuthCredential(
        user_id=user.id,
        provider=provider,
        access_token=token_encryptor.encrypt(token_data["access_token"]),
        refresh_token=token_encryptor.encrypt(token_data["refresh_token"]) if token_data.get("refresh_token") else None,
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
    )
    db.add(oauth_credential)
    await db.commit()
    
    return user


def get_refresh_token_from_header(request: Request) -> str:
    """Extract Bearer refresh token from Authorization header."""
    auth = request.headers.get("Authorization") or request.headers.get("authorization") or ""
    if not auth.startswith("Bearer ") and not auth.startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth.split(" ", 1)[1].strip()


@router.post("/refresh")
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token (POST with Bearer refresh token)."""
    try:
        token_string = get_refresh_token_from_header(request)
        token_data = decode_refresh_token(token_string)
        user_id_str = token_data["sub"]
        user_id = uuid.UUID(user_id_str)

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        # Create new access token and refresh token (rotation)
        new_access_token = create_access_token(subject=str(user.id))
        new_refresh_token = create_refresh_token(subject=str(user.id))
        
        # Revoke old refresh token
        await revoke_session(token_string)

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token  # Return new refresh token
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token"
        )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout user and revoke current session."""
    try:
        # Try to get refresh token from header X-Refresh-Token (as sent by apiClient)
        refresh_token = request.headers.get("X-Refresh-Token") or request.headers.get("x-refresh-token")
        
        if refresh_token:
            await revoke_session(refresh_token)
            logger.info("specific_session_revoked", user_id=current_user.id)
        else:
            # Fallback to revoking all if none provided (safer)
            await revoke_all_user_sessions(current_user.id)
            logger.info("all_sessions_revoked_at_logout", user_id=current_user.id)
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error("Logout failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout"
        )


@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout user and revoke all active sessions."""
    try:
        await revoke_all_user_sessions(current_user.id)
        logger.info("logout_all_sessions", user_id=current_user.id)
        return {"message": "All sessions logged out successfully"}
    except Exception as e:
        logger.error("Logout all failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout all sessions"
        )


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current user information."""
    try:
        # Get OAuth credentials
        result = await db.execute(
            select(OAuthCredential).where(OAuthCredential.user_id == current_user.id)
        )
        oauth_credentials = result.scalars().all()
        
        return {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "oauth_providers": [cred.provider for cred in oauth_credentials]
        }
        
    except Exception as e:
        logger.error("Failed to get user info", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


@router.get("/zoom/login")
async def zoom_login(
    current_user: User = Depends(get_current_user),
):
    """Initiate Zoom OAuth flow."""
    zoom_oauth = ZoomOAuth()
    state = secrets.token_urlsafe(32)
    auth_url = zoom_oauth.get_authorization_url(state)
    return {"auth_url": auth_url, "state": state}


@router.get("/zoom/callback")
async def zoom_callback(
    code: str,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Handle Zoom OAuth callback."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    try:
        zoom_oauth = ZoomOAuth()
        tokens = await zoom_oauth.exchange_code_for_tokens(code)
        
        # Store or update Zoom credentials
        result = await db.execute(
            select(OAuthCredential).where(
                and_(
                    OAuthCredential.user_id == current_user.id,
                    OAuthCredential.provider == "zoom"
                )
            )
        )
        credential = result.scalar_one_or_none()
        
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=tokens.get("expires_in", 3600))
        
        if not credential:
            credential = OAuthCredential(
                user_id=current_user.id,
                provider="zoom",
                access_token=token_encryptor.encrypt(tokens["access_token"]),
                refresh_token=token_encryptor.encrypt(tokens["refresh_token"]) if "refresh_token" in tokens else None,
                expires_at=expires_at
            )
            db.add(credential)
        else:
            credential.access_token = token_encryptor.encrypt(tokens["access_token"])
            if "refresh_token" in tokens:
                credential.refresh_token = token_encryptor.encrypt(tokens["refresh_token"])
            credential.expires_at = expires_at
            credential.updated_at = datetime.now(timezone.utc)
            
        await db.commit()
        return RedirectResponse(url=f"{settings.frontend_url}/settings?zoom=connected")
        
    except Exception as e:
        logger.error("zoom_callback_failed", error=str(e), user_id=current_user.id)
        return RedirectResponse(url=f"{settings.frontend_url}/settings?zoom=error")


# Include Microsoft router
api_router = APIRouter()
api_router.include_router(microsoft_router, prefix="/api/v1")
api_router.include_router(router, prefix="/api/v1")
