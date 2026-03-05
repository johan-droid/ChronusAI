from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from cryptography.fernet import Fernet
from jose import jwt

from app.config import settings


class TokenEncryptor:
    def __init__(self, key: bytes):
        self.fernet = Fernet(key)  # Key from ENCRYPTION_KEY env var (base64-encoded 32 bytes)

    def encrypt(self, token: str) -> str:
        return self.fernet.encrypt(token.encode()).decode()

    def decrypt(self, encrypted_token: str) -> str:
        return self.fernet.decrypt(encrypted_token.encode()).decode()


token_encryptor = TokenEncryptor(settings.encryption_key.encode())


def create_access_token(subject: str, expires_minutes: int | None = None) -> str:
    exp_minutes = expires_minutes or settings.jwt_expire_minutes
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=exp_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def hash_user_id(user_id: str) -> str:
    # Stable hash for logs; includes a secret pepper
    return hashlib.sha256(f"{user_id}:{settings.secret_key}".encode()).hexdigest()


def mask_email(email: str) -> str:
    try:
        local, domain = email.split("@", 1)
    except ValueError:
        return "***"
    if len(local) <= 2:
        masked_local = "*" * len(local)
    else:
        masked_local = f"{local[0]}***{local[-1]}"
    return f"{masked_local}@{domain}"

