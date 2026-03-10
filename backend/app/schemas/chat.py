from pydantic import BaseModel, Field
from typing import Optional, List, Literal, Any


class ParsedIntent(BaseModel):
    intent: Literal[
        "schedule",
        "reschedule",
        "cancel",
        "check_availability",
        "find_time",
        "list_meetings",
        "suggest_times",
        "unknown",
    ] = "unknown"
    title: Optional[str] = None
    event_id: Optional[str] = None  # Google Calendar event ID for precise targeting
    description: Optional[str] = None
    start_time: Optional[str] = None  # ISO datetime string (local time)
    end_time: Optional[str] = None    # ISO datetime string (local time)
    attendees: List[str] = Field(default_factory=list)  # Email addresses
    duration_minutes: Optional[int] = None
    meeting_type: Optional[str] = None   # standup, review, sync, presentation, call, other
    meeting_platform: Optional[Literal["zoom", "meet", "teams", "none"]] = None
    response: str = ""
    suggestions: Optional[List[dict[str, Any]]] = None
    conflicts: Optional[List[dict[str, Any]]] = None
    recurring: Optional[dict[str, Any]] = None


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str
    meeting: Optional[dict] = None
    requires_clarification: bool = False
    suggestions: Optional[List[Any]] = None  # e.g. [{"time": "ISO", "reason": "..."}]
    confidence: Optional[float] = None


class ConversationMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    timestamp: str
