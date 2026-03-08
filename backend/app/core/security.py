from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from cryptography.fernet import Fernet
from jose import jwt, JWTError
from passlib.context import CryptContext

from app.config import settings

# In-memory session storage (should be Redis in production)
_active_sessions: Dict[str, Dict[str, Any]] = {}


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
            _active_sessions.pop(jti, None)
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
        _active_sessions.pop(jti, None)
        revoked += 1
    
    return revoked


def cleanup_expired_sessions() -> int:
    """Clean up expired sessions."""
    now = datetime.now(timezone.utc)
    expired = []
    
    for jti, session in _active_sessions.items():
        # Remove sessions older than 7 days or inactive for 24 hours
        created_at = session.get("created_at")
        last_used = session.get("last_used")
        
        if isinstance(created_at, datetime) and isinstance(last_used, datetime):
            if (now - created_at).days > 7 or (now - last_used).total_seconds() > 24 * 3600:
                expired.append(jti)
        else:
            expired.append(jti)
    
    for jti in expired:
        _active_sessions.pop(jti, None)
    
    return len(expired)



pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed one."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def hash_user_id(user_id: str) -> str:
    """Hash user ID for logging."""
    hash_str = str(hashlib.sha256(f"{user_id}:{settings.secret_key}".encode()).hexdigest())
    return hash_str[:16]  # type: ignore



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

