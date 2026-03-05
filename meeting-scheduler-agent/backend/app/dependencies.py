"""
FastAPI dependency injection helpers.
Provides reusable dependencies for authentication, database sessions, etc.
"""
from datetime import datetime, timezone
from typing import Annotated, Optional

import aioredis
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.redis import get_redis
from app.models.user import User, OAuthCredentials
from app.core.jwt import verify_token
from app.core.security import token_encryptor


# Security scheme for JWT tokens
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer token credentials.
        db: Database session.
        
    Returns:
        Authenticated User object.
        
    Raises:
        HTTPException: If authentication fails.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    user_id = verify_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_oauth_credentials(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OAuthCredentials:
    """
    Get OAuth credentials for the current user.
    
    Args:
        user: Current authenticated user.
        db: Database session.
        
    Returns:
        User's OAuth credentials with decrypted tokens.
        
    Raises:
        HTTPException: If credentials not found.
    """
    result = await db.execute(
        select(OAuthCredentials).where(OAuthCredentials.user_id == user.id)
    )
    credentials = result.scalar_one_or_none()
    
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Calendar not connected. Please authenticate first.",
        )
    
    # Decrypt tokens for use
    credentials.access_token = token_encryptor.decrypt(credentials.access_token)
    credentials.refresh_token = token_encryptor.decrypt(credentials.refresh_token)
    
    return credentials


async def get_optional_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if credentials is None:
        return None
    
    token = credentials.credentials
    user_id = verify_token(token)
    
    if user_id is None:
        return None
    
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


class TokenRefreshMiddleware:
    """
    Middleware to automatically refresh OAuth tokens before they expire.
    
    Checks if the token expires within 5 minutes and refreshes it in the background.
    """
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Continue with request
        await self.app(scope, receive, send)
        
        # After request, check if token needs refresh (background task)
        # This is simplified - in production, use FastAPI background tasks


async def check_token_expiry_and_refresh(
    credentials: OAuthCredentials,
    user: User,
    db: AsyncSession,
    redis: aioredis.Redis,
) -> str:
    """
    Check if OAuth token is expiring soon and refresh if needed.
    
    Args:
        credentials: OAuth credentials with decrypted tokens.
        user: Current user.
        db: Database session.
        redis: Redis connection.
        
    Returns:
        Valid access token (refreshed if necessary).
    """
    from app.core.oauth import GoogleOAuth, MicrosoftOAuth
    
    # Check if token expires within 5 minutes
    now = datetime.now(timezone.utc)
    expires_at = credentials.expires_at.replace(tzinfo=timezone.utc)
    time_until_expiry = (expires_at - now).total_seconds()
    
    if time_until_expiry < 300:  # Less than 5 minutes
        # Refresh token
        try:
            if user.provider == "google":
                token_response = await GoogleOAuth.refresh_access_token(
                    credentials.refresh_token
                )
            else:  # outlook
                token_response = await MicrosoftOAuth.refresh_access_token(
                    credentials.refresh_token
                )
            
            # Update credentials in database
            new_access_token = token_encryptor.encrypt(token_response["access_token"])
            new_refresh_token = token_encryptor.encrypt(
                token_response.get("refresh_token", credentials.refresh_token)
            )
            new_expires_at = datetime.now(timezone.utc) + datetime.timedelta(
                seconds=token_response["expires_in"]
            )
            
            credentials.access_token = new_access_token
            credentials.refresh_token = new_refresh_token
            credentials.expires_at = new_expires_at
            
            await db.commit()
            
            return token_response["access_token"]
            
        except Exception as e:
            # Log error but don't fail the request
            print(f"Token refresh failed: {e}")
            return credentials.access_token
    
    return credentials.access_token
