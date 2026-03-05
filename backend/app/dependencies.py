from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token, token_encryptor
from app.db.redis import redis_client
from app.db.session import get_db
from app.models.oauth_credential import OAuthCredential
from app.models.user import User
from app.services.calendar_provider import CalendarProvider

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def get_calendar_provider(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CalendarProvider:
    """Get the appropriate calendar provider for the user."""
    result = await db.execute(select(OAuthCredential).where(OAuthCredential.user_id == current_user.id))
    oauth_credential = result.scalar_one_or_none()
    if oauth_credential is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OAuth credentials found for user"
        )
    
    access_token = getattr(request.state, "oauth_access_token", None)
    if not access_token:
        access_token = token_encryptor.decrypt(oauth_credential.access_token)
    
    if current_user.provider == "google":
        from app.services.google_calendar import GoogleCalendarAdapter
        return GoogleCalendarAdapter(access_token)
    elif current_user.provider == "outlook":
        from app.services.outlook_calendar import OutlookCalendarAdapter
        return OutlookCalendarAdapter(access_token)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported provider: {current_user.provider}"
        )


async def get_conversation_context(user_id: str) -> list:
    """Get conversation context from Redis."""
    context_key = f"session:{user_id}"
    context = await redis_client.get_json(context_key)
    
    if not context:
        return []
    
    return context.get("messages", [])


async def save_conversation_context(user_id: str, messages: list):
    """Save conversation context to Redis."""
    context_key = f"session:{user_id}"
    context_data = {
        "messages": messages[-6:],  # Keep only last 6 messages (3 turns)
        "last_active_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Set with 24 hour expiry
    await redis_client.set_json(context_key, context_data, ex=86400)
