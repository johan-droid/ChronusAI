"""User-domain Pydantic schemas.

Kept strictly separate from the Organization domain.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# ── Shared base ───────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    timezone: str = "UTC"
    provider: str


# ── Registration / Auth request bodies ───────────────────────────────────────

class UserRegister(BaseModel):
    """Used for email/password sign-up."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ── Token responses ───────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    """Returned from /auth/login and /auth/refresh.

    The refresh token is NOT included here — it lives in an HttpOnly cookie.
    """
    access_token: str
    token_type: str = "bearer"


# ── Password reset ────────────────────────────────────────────────────────────

class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit.")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter.")
        return v


# ── Email verification ────────────────────────────────────────────────────────

class EmailVerificationRequest(BaseModel):
    token: str


# ── Profile read / update ─────────────────────────────────────────────────────

class UserRead(UserBase):
    id: UUID
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, max_length=100)
    timezone: Optional[str] = None


# ── Legacy aliases kept so existing code doesn't break ───────────────────────
UserCreate = UserRegister
