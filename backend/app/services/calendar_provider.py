from abc import ABC, abstractmethod
from typing import List
from datetime import datetime
from dataclasses import dataclass

from app.schemas.meeting import MeetingCreate


@dataclass
class TimeSlot:
    start: datetime
    end: datetime
    
    def duration_minutes(self) -> int:
        return int((self.end - self.start).total_seconds() / 60)


class CalendarProvider(ABC):
    @abstractmethod
    async def get_free_busy(self, start: datetime, end: datetime, attendees: List[str]) -> List[TimeSlot]:
        """Returns list of busy TimeSlot objects for the given window."""
        pass

    @abstractmethod
    async def create_event(self, meeting: MeetingCreate) -> str:
        """Creates calendar event and returns the external event ID."""
        pass

    @abstractmethod
    async def delete_event(self, external_event_id: str) -> bool:
        pass

    @abstractmethod
    async def update_event(self, external_event_id: str, meeting: MeetingCreate) -> bool:
        pass
