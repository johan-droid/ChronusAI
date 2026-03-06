from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime


class ParsedIntent(BaseModel):
    intent: Literal[
        "schedule", 
        "reschedule", 
        "cancel", 
        "check_availability", 
        "unknown"
    ]
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None  # ISO datetime string
    end_time: Optional[str] = None    # ISO datetime string
    attendees: List[str] = []         # Email addresses as strings
    response: str                     # User-friendly response message


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str
    meeting: Optional[dict] = None
    requires_clarification: bool = False
    suggestions: Optional[List[str]] = None
    confidence: Optional[float] = None


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: str
