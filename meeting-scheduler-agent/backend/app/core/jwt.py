"""
JWT token helpers for authentication.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import jwt
from pydantic import ValidationError

from app.config import get_settings


settings = get_settings()


def create_access_token(
    subject: str | int,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: The subject (usually user ID or email) to encode in the token.
        expires_delta: Optional custom expiration time delta.
        
    Returns:
        Encoded JWT token string.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "iat": datetime.now(timezone.utc),
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: The JWT token to decode.
        
    Returns:
        Decoded token payload as dict, or None if invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except (jwt.JWTError, ValidationError):
        return None


def verify_token(token: str) -> Optional[str]:
    """
    Verify a token and return the subject.
    
    Args:
        token: The JWT token to verify.
        
    Returns:
        Subject (user ID) from token, or None if invalid.
    """
    payload = decode_access_token(token)
    if payload is None:
        return None
    
    return payload.get("sub")
