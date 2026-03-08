from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token, token_encryptor
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
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise credentials_exception
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
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
    """Get appropriate calendar provider for user."""
    try:
        result = await db.execute(
            select(OAuthCredential).where(
                and_(
                    OAuthCredential.user_id == current_user.id,
                    OAuthCredential.provider == current_user.provider
                )
            )
        )
        oauth_credential = result.scalar_one_or_none()
        if oauth_credential is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OAuth credentials found for user. Please authenticate again."
            )
        
        access_token = getattr(request.state, "oauth_access_token", None)
        if not access_token:
            try:
                access_token = token_encryptor.decrypt(oauth_credential.access_token)  # type: ignore[arg-type]
            except Exception:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="OAuth token decryption failed. Please authenticate again."
                )
        
        if current_user.provider == "google":
            from app.services.google_calendar import GoogleCalendarAdapter
            return GoogleCalendarAdapter(access_token)
        elif current_user.provider == "outlook":
            from app.services.outlook_calendar import OutlookCalendarAdapter
            return OutlookCalendarAdapter(access_token)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported provider: {str(current_user.provider)}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Calendar provider initialization failed: {str(e)}"
        )


async def get_conversation_context(user_id: str) -> list:
    """Get conversation context (in-memory fallback)."""
    return []


async def save_conversation_context(user_id: str, messages: list):
    """Save conversation context (no-op without Redis)."""
    pass
