from pydantic import BaseModel, ConfigDict, EmailStr
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
    # Per-meeting reminder schedule in minutes before the event (e.g. [1440, 60, 3])
    reminder_schedule_minutes: Optional[List[int]] = None
    # Methods to use for Google reminders: 'email', 'popup'
    reminder_methods: Optional[List[str]] = None
    provider: str
    meeting_url: Optional[str] = None


class MeetingCreate(MeetingBase):
    raw_user_input: Optional[str] = None


class MeetingRead(MeetingBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    external_event_id: Optional[str] = None
    status: str
    raw_user_input: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[Attendee]] = None
    reminder_schedule_minutes: Optional[List[int]] = None
    reminder_methods: Optional[List[str]] = None
