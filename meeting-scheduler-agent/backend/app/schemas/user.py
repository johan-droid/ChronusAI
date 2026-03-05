"""
Pydantic schemas for user-related requests and responses.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserRead(BaseModel):
    """Schema for reading user information."""
    
    id: UUID
    email: str
    full_name: Optional[str]
    timezone: str
    provider: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    
    full_name: Optional[str] = Field(None, max_length=255)
    timezone: Optional[str] = Field(None, max_length=100)


class OAuthCallbackRequest(BaseModel):
    """Schema for OAuth callback parameters."""
    
    code: str
    state: Optional[str] = None


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    
    access_token: str
    token_type: str = "bearer"
    expires_in: int
