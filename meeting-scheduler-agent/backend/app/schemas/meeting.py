"""
Pydantic schemas for meeting-related requests and responses.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class MeetingCreate(BaseModel):
    """Schema for creating a meeting."""
    
    title: str = Field(..., min_length=1, max_length=512)
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees: List[EmailStr] = []


class MeetingUpdate(BaseModel):
    """Schema for updating a meeting."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=512)
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[EmailStr]] = None


class MeetingRead(BaseModel):
    """Schema for reading a meeting."""
    
    id: UUID
    user_id: UUID
    external_event_id: Optional[str]
    title: str
    description: Optional[str]
    start_time: datetime
    end_time: datetime
    attendees: list
    status: str
    provider: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class MeetingListResponse(BaseModel):
    """Response schema for listing meetings."""
    
    meetings: List[MeetingRead]
    total: int
