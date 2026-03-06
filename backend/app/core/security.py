from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from cryptography.fernet import Fernet
from jose import jwt, JWTError

from app.config import settings


class TokenEncryptor:
    def __init__(self, key: bytes):
        self.fernet = Fernet(key)

    def encrypt(self, token: str) -> str:
        return self.fernet.encrypt(token.encode()).decode()

    def decrypt(self, encrypted_token: str) -> str:
        return self.fernet.decrypt(encrypted_token.encode()).decode()


token_encryptor = TokenEncryptor(settings.encryption_key.encode())

# Session store for refresh tokens (in production, use Redis)
_active_sessions: Dict[str, Dict[str, Any]] = {}


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    """Create JWT access token with enhanced security."""
    exp_minutes = expires_minutes or settings.jwt_expire_minutes
    now = datetime.now(timezone.utc)
    jti = secrets.token_urlsafe(32)  # Unique token ID
    
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=exp_minutes)).timestamp()),
        "jti": jti,
        "type": "access"
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> str:
    """Create refresh token with 7-day expiry."""
    now = datetime.now(timezone.utc)
    jti = secrets.token_urlsafe(32)
    
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=7)).timestamp()),
        "jti": jti,
        "type": "refresh"
    }
    
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    # Store session info
    _active_sessions[jti] = {
        "user_id": subject,
        "created_at": now,
        "last_used": now
    }
    
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate access token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        return payload
    except JWTError:
        raise


def decode_refresh_token(token: str) -> Dict[str, Any]:
    """Decode and validate refresh token."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        if payload.get("type") != "refresh":
            raise JWTError("Invalid token type")
        
        jti = payload.get("jti")
        if not jti or jti not in _active_sessions:
            raise JWTError("Session not found or expired")
        
        # Update last used
        _active_sessions[jti]["last_used"] = datetime.now(timezone.utc)
        
        return payload
    except JWTError:
        raise


def revoke_session(refresh_token: str) -> bool:
    """Revoke a refresh token session."""
    try:
        payload = jwt.decode(refresh_token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        jti = payload.get("jti")
        if jti and jti in _active_sessions:
            del _active_sessions[jti]
            return True
    except JWTError:
        pass
    return False


def revoke_all_user_sessions(user_id: str) -> int:
    """Revoke all sessions for a user."""
    revoked = 0
    to_remove = []
    
    for jti, session in _active_sessions.items():
        if session["user_id"] == user_id:
            to_remove.append(jti)
    
    for jti in to_remove:
        del _active_sessions[jti]
        revoked += 1
    
    return revoked


def cleanup_expired_sessions() -> int:
    """Clean up expired sessions."""
    now = datetime.now(timezone.utc)
    expired = []
    
    for jti, session in _active_sessions.items():
        # Remove sessions older than 7 days or inactive for 24 hours
        if (now - session["created_at"]).days > 7 or (now - session["last_used"]).hours > 24:
            expired.append(jti)
    
    for jti in expired:
        del _active_sessions[jti]
    
    return len(expired)


def hash_user_id(user_id: str) -> str:
    """Hash user ID for logging."""
    return hashlib.sha256(f"{user_id}:{settings.secret_key}".encode()).hexdigest()[:16]


def mask_email(email: str) -> str:
    """Mask email for logging."""
    try:
        local, domain = email.split("@", 1)
    except ValueError:
        return "***"
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = f"{local[0]}***{local[-1]}"
    return f"{masked_local}@{domain}"

