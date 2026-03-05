"""
Abstract base class for calendar providers.
All calendar adapters (Google, Outlook) must implement this interface.
"""
from abc import ABC, abstractmethod
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class TimeSlot(BaseModel):
    """Represents a time slot (busy or available)."""
    
    start: datetime
    end: datetime
    
    def duration_minutes(self) -> int:
        """Calculate duration in minutes."""
        return int((self.end - self.start).total_seconds() / 60)
    
    def overlaps_with(self, other: "TimeSlot") -> bool:
        """Check if this slot overlaps with another."""
        return self.start < other.end and other.start < self.end


class CalendarProvider(ABC):
    """
    Abstract interface for calendar providers.
    
    All calendar adapters must implement these methods to ensure
    consistent behavior across Google Calendar and Microsoft Outlook.
    """
    
    @abstractmethod
    async def get_free_busy(
        self,
        start: datetime,
        end: datetime,
        attendees: Optional[List[str]] = None,
    ) -> List[TimeSlot]:
        """
        Get busy time slots for a given time window.
        
        Args:
            start: Start of the time window (UTC).
            end: End of the time window (UTC).
            attendees: Optional list of attendee emails to check availability.
            
        Returns:
            List of TimeSlot objects representing busy periods.
        """
        pass
    
    @abstractmethod
    async def create_event(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> str:
        """
        Create a calendar event.
        
        Args:
            title: Event title.
            start_time: Event start time (UTC).
            end_time: Event end time (UTC).
            description: Optional event description.
            attendees: Optional list of attendee emails.
            
        Returns:
            External event ID from the calendar provider.
        """
        pass
    
    @abstractmethod
    async def delete_event(self, external_event_id: str) -> bool:
        """
        Delete a calendar event.
        
        Args:
            external_event_id: The event ID from the calendar provider.
            
        Returns:
            True if deletion was successful.
        """
        pass
    
    @abstractmethod
    async def update_event(
        self,
        external_event_id: str,
        title: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> bool:
        """
        Update an existing calendar event.
        
        Args:
            external_event_id: The event ID from the calendar provider.
            title: New title (optional).
            start_time: New start time (optional).
            end_time: New end time (optional).
            description: New description (optional).
            attendees: New attendee list (optional).
            
        Returns:
            True if update was successful.
        """
        pass
