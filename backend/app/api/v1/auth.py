from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.oauth import get_oauth_provider
from app.core.security import create_access_token, token_encryptor, create_refresh_token, decode_refresh_token, revoke_session, revoke_all_user_sessions, hash_user_id, mask_email
from app.dependencies import get_current_user
from app.db.session import get_db
from app.models.oauth_credential import OAuthCredential
from app.models.user import User
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/auth", tags=["authentication"])


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
    """Handle OAuth callback from provider."""
    try:
        oauth_provider = get_oauth_provider(provider)
        
        # Exchange code for tokens (no PKCE verifier needed with client_secret)
        try:
            tokens = await oauth_provider.exchange_code_for_tokens(code, None)
        except Exception as token_error:
            raise HTTPException(
                status_code=400, 
                detail=f"Token exchange failed: {str(token_error)}"
            )

        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="OAuth token exchange failed")

        # Fetch user profile
        async with httpx.AsyncClient(timeout=30) as client:
            if provider == "google":
                profile_resp = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                profile_resp.raise_for_status()
                profile = profile_resp.json()
                user_email = profile.get("email")
                full_name = profile.get("name")
            else:
                profile_resp = await client.get(
                    "https://graph.microsoft.com/v1.0/me",
                    headers={"Authorization": f"Bearer {access_token}"},
                )
                profile_resp.raise_for_status()
                profile = profile_resp.json()
                user_email = profile.get("mail") or profile.get("userPrincipalName")
                full_name = profile.get("displayName")

        if not user_email:
            raise HTTPException(status_code=400, detail="Could not read user email")

        # Find or create user
        result = await db.execute(select(User).where(User.email == user_email))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(email=user_email, full_name=full_name, provider=provider, timezone="UTC")
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            setattr(user, 'provider', provider)
            if full_name and not user.full_name:
                setattr(user, 'full_name', full_name)
            await db.commit()
        
        # Encrypt and store tokens
        encrypted_access = token_encryptor.encrypt(access_token)
        refresh_token = tokens.get("refresh_token") or ""
        encrypted_refresh = token_encryptor.encrypt(refresh_token) if refresh_token else token_encryptor.encrypt("")
        
        # Calculate expiry
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(tokens.get("expires_in", 3600)))
        
        # Store or update OAuth credentials
        result = await db.execute(select(OAuthCredential).where(OAuthCredential.user_id == user.id))
        existing_cred = result.scalar_one_or_none()
        scopes = tokens.get("scope", "")
        scopes_list = scopes.split() if isinstance(scopes, str) else None
        
        if existing_cred:
            setattr(existing_cred, 'access_token', encrypted_access)
            setattr(existing_cred, 'refresh_token', encrypted_refresh)
            setattr(existing_cred, 'expires_at', expires_at)
            setattr(existing_cred, 'scopes', scopes_list)
        else:
            oauth_cred = OAuthCredential(
                user_id=user.id,
                access_token=encrypted_access,
                refresh_token=encrypted_refresh,
                expires_at=expires_at,
                scopes=scopes_list
            )
            db.add(oauth_cred)
        
        await db.commit()
        
        # Create JWT tokens
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))
        
        # Redirect to frontend with tokens
        redirect_url = f"{settings.frontend_url}/login?access_token={access_token}&refresh_token={refresh_token}"
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OAuth callback failed: {str(e)}"
        )


@router.post("/refresh")
async def refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    try:
        auth_header = request.headers.get("authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing refresh token")
        
        refresh_token = auth_header.split(" ")[1]
        payload = decode_refresh_token(refresh_token)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        # Verify user still exists
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Create new access token
        new_access_token = create_access_token(str(user.id))
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expire_minutes * 60
        }
        
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout user and revoke refresh token."""
    try:
        auth_header = request.headers.get("x-refresh-token")
        if auth_header:
            revoke_session(auth_header)
        
        # Get OAuth credentials to revoke tokens
        result = await db.execute(select(OAuthCredential).where(OAuthCredential.user_id == current_user.id))
        oauth_cred = result.scalar_one_or_none()
        
        logout_url = None
        if oauth_cred and current_user.provider:
            try:
                provider_str = str(current_user.provider)
                oauth_provider = get_oauth_provider(provider_str)
                
                # Revoke tokens if provider supports it
                if oauth_cred.access_token:
                    access_token_str = str(oauth_cred.access_token)
                    decrypted_token = token_encryptor.decrypt(access_token_str)
                    await oauth_provider.revoke_token(decrypted_token)
                
                # Get logout URL for frontend redirect
                frontend_url_str = str(settings.frontend_url)
                logout_url = oauth_provider.get_logout_url(frontend_url_str)
            except Exception as e:
                logger.warning("oauth_revoke_failed", error=str(e))
        
        logger.info(
            "user_logged_out",
            user_id_hash=hash_user_id(str(current_user.id)),
            email=mask_email(str(current_user.email))
        )
        
        return {
            "message": "Logged out successfully",
            "logout_url": logout_url,
            "provider": current_user.provider
        }
        
    except Exception as e:
        logger.error("logout_failed", error=str(e))
        return {"message": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout from all devices."""
    try:
        revoked_count = revoke_all_user_sessions(str(current_user.id))
        
        # Get OAuth credentials to revoke tokens
        result = await db.execute(select(OAuthCredential).where(OAuthCredential.user_id == current_user.id))
        oauth_cred = result.scalar_one_or_none()
        
        logout_url = None
        if oauth_cred and current_user.provider:
            try:
                provider_str = str(current_user.provider)
                oauth_provider = get_oauth_provider(provider_str)
                
                # Revoke all tokens
                if oauth_cred.access_token:
                    access_token_str = str(oauth_cred.access_token)
                    decrypted_token = token_encryptor.decrypt(access_token_str)
                    await oauth_provider.revoke_token(decrypted_token)
                
                if oauth_cred.refresh_token:
                    refresh_token_str = str(oauth_cred.refresh_token)
                    decrypted_refresh = token_encryptor.decrypt(refresh_token_str)
                    if decrypted_refresh:
                        await oauth_provider.revoke_token(decrypted_refresh)
                
                # Get logout URL for frontend redirect
                frontend_url_str = str(settings.frontend_url)
                logout_url = oauth_provider.get_logout_url(frontend_url_str)
            except Exception as e:
                logger.warning("oauth_revoke_all_failed", error=str(e))
        
        logger.info(
            "user_logged_out_all_devices",
            user_id_hash=hash_user_id(str(current_user.id)),
            sessions_revoked=revoked_count
        )
        
        return {
            "message": f"Logged out from {revoked_count} devices",
            "logout_url": logout_url,
            "provider": current_user.provider
        }
        
    except Exception as e:
        logger.error("logout_all_failed", error=str(e))
        return {"message": "Logged out from all devices"}
