from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class Attendee(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    response_status: Optional[str] = None


class MeetingBase(BaseModel):
    title: str = "Meeting"
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees: List[Attendee] = []
    provider: str


class MeetingCreate(MeetingBase):
    raw_user_input: Optional[str] = None


class MeetingRead(MeetingBase):
    id: UUID
    user_id: UUID
    external_event_id: Optional[str] = None
    status: str
    raw_user_input: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[Attendee]] = None
