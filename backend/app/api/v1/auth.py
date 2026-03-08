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

router = APIRouter(tags=["authentication"])

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
        logger.info("OAuth callback received", provider=provider, state=state[:10] + "...", code_length=len(code))
        
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
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        refresh_token = create_refresh_token(user_id=user.id)
        
        # Store refresh token
        await token_encryptor.store_refresh_token(user.id, refresh_token)
        
        # Redirect to frontend with tokens
        frontend_url = str(settings.frontend_url)
        redirect_url = f"{frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}"
        
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
        select(OAuthCredential).where(OAuthCredential.user_id == user.id, OAuthCredential.provider == provider)
    )
    oauth_credential = result.scalar_one_or_none()
    
    if oauth_credential:
        # Update existing credential
        oauth_credential.access_token = token_data["access_token"]
        oauth_credential.refresh_token = token_data.get("refresh_token")
        oauth_credential.expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
    else:
        # Create new credential
        oauth_credential = OAuthCredential(
            user_id=user.id,
            provider=provider,
            access_token=token_data["access_token"],
            refresh_token=token_data.get("refresh_token"),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
        )
        db.add(oauth_credential)
    
    await db.commit()


async def create_new_user(db: AsyncSession, user_info: dict, provider: str, token_data: dict) -> User:
    """Create a new user with OAuth credentials."""
    user = User(
        email=user_info["email"],
        name=user_info.get("name", ""),
        hashed_password="",  # OAuth users don't have passwords
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.flush()  # Get the user ID
    
    # Create OAuth credentials
    oauth_credential = OAuthCredential(
        user_id=user.id,
        provider=provider,
        access_token=token_data["access_token"],
        refresh_token=token_data.get("refresh_token"),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))
    )
    db.add(oauth_credential)
    await db.commit()
    
    return user


@router.get("/refresh")
async def refresh_token(
    refresh_token: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token using refresh token."""
    try:
        # Decode and validate refresh token
        token_data = decode_refresh_token(refresh_token)
        user_id = token_data["sub"]
        
        # Get user
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new access token
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        
        return {"access_token": access_token}
        
    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token"
        )


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Logout user and revoke tokens."""
    try:
        # Revoke all user sessions
        await revoke_all_user_sessions(current_user.id)
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error("Logout failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout"
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


# Include Microsoft router
api_router = APIRouter()
api_router.include_router(microsoft_router, prefix="/api/v1")
api_router.include_router(router, prefix="/api/v1")
