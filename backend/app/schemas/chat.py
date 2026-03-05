from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import date, time


class ParsedIntent(BaseModel):
    intent: Literal[
        "CREATE_MEETING", 
        "UPDATE_MEETING", 
        "CANCEL_MEETING", 
        "QUERY_AVAILABILITY", 
        "UNKNOWN"
    ]
    title: Optional[str] = None
    attendees: List[EmailStr] = []
    target_date: Optional[date] = None
    target_time: Optional[time] = None
    time_preference: Optional[Literal["morning", "afternoon", "evening"]] = None
    duration_minutes: Optional[int] = Field(default=30, ge=15, le=480)
    meeting_id_to_modify: Optional[str] = None
    clarification_needed: Optional[str] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str
    meeting: Optional[dict] = None
    requires_clarification: bool = False


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: str
