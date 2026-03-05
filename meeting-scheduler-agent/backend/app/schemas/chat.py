"""
Pydantic schemas for chat-related requests and responses.
"""
from datetime import date, time
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class ChatRequest(BaseModel):
    """Request schema for chat messages."""
    
    message: str = Field(..., description="User's natural language message")


class ParsedIntentSchema(BaseModel):
    """Schema for parsed intent (matches LLM service output)."""
    
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
    duration_minutes: Optional[int] = 30
    meeting_id_to_modify: Optional[str] = None
    clarification_needed: Optional[str] = None


class MeetingInfo(BaseModel):
    """Simplified meeting information for chat responses."""
    
    id: str
    title: str
    start_time: str  # ISO format string
    end_time: str    # ISO format string
    attendees: List[dict]
    status: str


class ChatResponse(BaseModel):
    """Response schema for chat messages."""
    
    response: str = Field(..., description="Bot's natural language response")
    intent: Optional[str] = Field(None, description="Detected intent")
    meeting: Optional[MeetingInfo] = Field(None, description="Created/updated meeting info")


class ConversationMessage(BaseModel):
    """Single message in conversation history."""
    
    role: Literal["user", "assistant"]
    content: str


class ConversationContext(BaseModel):
    """Conversation context stored in Redis."""
    
    messages: List[ConversationMessage] = []
    last_intent: Optional[str] = None
    pending_action: Optional[dict] = None
