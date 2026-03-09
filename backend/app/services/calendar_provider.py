from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional, Dict, Any

from app.schemas.meeting import MeetingCreate


@dataclass
class TimeSlot:
    start: datetime
    end: datetime

    def duration_minutes(self) -> int:
        return int((self.end - self.start).total_seconds() / 60)


@dataclass
class CreateEventResult:
    """Result of creating a calendar event; may include video conference link."""
    event_id: str
    meeting_url: Optional[str] = None


class CalendarProvider(ABC):
    @abstractmethod
    async def get_free_busy(self, start: datetime, end: datetime, attendees: List[str]) -> List[TimeSlot]:
        """Returns list of busy TimeSlot objects for the given window."""
        pass

    @abstractmethod
    async def create_event(
        self,
        meeting: MeetingCreate,
        *,
        add_video_conference: Optional[str] = None,
    ) -> CreateEventResult:
        """Creates calendar event. add_video_conference: 'google_meet' | 'teams' | None. Returns event ID and optional meeting URL."""
        pass

    @abstractmethod
    async def delete_event(self, external_event_id: str) -> bool:
        pass

    @abstractmethod
    async def update_event(self, external_event_id: str, meeting: MeetingCreate) -> bool:
        pass

    @abstractmethod
    async def list_events(self, start: datetime, end: datetime) -> List[Dict[str, Any]]:
        """Returns list of events as dictionaries."""
        pass
