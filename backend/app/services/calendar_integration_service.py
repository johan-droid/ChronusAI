"""
Unified Calendar Integration Service
Handles both Google Calendar and Outlook Calendar integrations
"""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta, timezone
from enum import Enum
import structlog
from app.services.google_calendar_service import GoogleCalendarService, TimeSlot
from app.services.outlook_calendar import OutlookCalendarService

logger = structlog.get_logger()

class CalendarProvider(Enum):
    """Supported calendar providers"""
    GOOGLE = "google"
    OUTLOOK = "outlook"

class CalendarIntegrationService:
    """Unified calendar integration service"""
    
    def __init__(self, user_id: str, provider: str, db_session):
        self.user_id = user_id
        self.provider = CalendarProvider(provider.lower())
        self.db = db_session
        self._service = None
    
    @property
    def service(self) -> Union[GoogleCalendarService, OutlookCalendarService]:
        """Get the appropriate calendar service"""
        if self._service is None:
            if self.provider == CalendarProvider.GOOGLE:
                self._service = GoogleCalendarService(self.user_id, self.db)
            elif self.provider == CalendarProvider.OUTLOOK:
                self._service = OutlookCalendarService(self.user_id, self.db)
            else:
                raise ValueError(f"Unsupported calendar provider: {self.provider}")
        return self._service
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to calendar service"""
        try:
            result = await self.service.test_connection()
            return {
                "provider": self.provider.value,
                "status": result["status"],
                "details": result
            }
        except Exception as e:
            logger.error("calendar_connection_test_failed", error=str(e), provider=self.provider.value)
            return {
                "provider": self.provider.value,
                "status": "error",
                "error": str(e)
            }
    
    async def get_calendars(self) -> List[Dict[str, Any]]:
        """Get list of user's calendars"""
        try:
            calendars = await self.service.get_calendar_list()
            return [
                {
                    "id": cal.id,
                    "summary": cal.summary,
                    "description": cal.description,
                    "timezone": cal.timezone,
                    "primary": cal.primary,
                    "access_role": cal.access_role,
                    "provider": self.provider.value
                }
                for cal in calendars
            ]
        except Exception as e:
            logger.error("get_calendars_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to retrieve calendars from {self.provider.value}: {str(e)}")
    
    async def get_events(
        self,
        calendar_id: str = "primary",
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        max_results: int = 250
    ) -> List[Dict[str, Any]]:
        """Get events from calendar"""
        try:
            events = await self.service.get_events(calendar_id, start_time, end_time, max_results)
            return [
                {
                    "id": event.id,
                    "summary": event.summary,
                    "description": event.description,
                    "start": event.start.isoformat(),
                    "end": event.end.isoformat(),
                    "location": event.location,
                    "status": event.status,
                    "attendees": event.attendees,
                    "created": event.created.isoformat() if event.created else None,
                    "updated": event.updated.isoformat() if event.updated else None,
                    "provider": self.provider.value
                }
                for event in events
            ]
        except Exception as e:
            logger.error("get_events_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to retrieve events from {self.provider.value}: {str(e)}")
    
    async def get_availability(
        self,
        calendar_ids: Optional[List[str]] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        duration_minutes: int = 30
    ) -> Dict[str, Any]:
        """Get available time slots for scheduling"""
        try:
            available_slots = await self.service.get_availability(calendar_ids, start_time, end_time, duration_minutes)
            return {
                "provider": self.provider.value,
                "available_slots": [
                    {
                        "start": slot.start.isoformat(),
                        "end": slot.end.isoformat(),
                        "duration_minutes": int((slot.end - slot.start).total_seconds() / 60),
                        "is_available": slot.is_available
                    }
                    for slot in available_slots
                ],
                "total_slots": len(available_slots),
                "search_period": {
                    "start": start_time.isoformat() if start_time else None,
                    "end": end_time.isoformat() if end_time else None,
                    "duration_minutes": duration_minutes
                }
            }
        except Exception as e:
            logger.error("get_availability_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to retrieve availability from {self.provider.value}: {str(e)}")
    
    async def get_free_busy(
        self,
        calendar_ids: List[str],
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, Any]:
        """Get free/busy information for calendars"""
        try:
            if self.provider == CalendarProvider.GOOGLE:
                busy_slots = await self.service.get_free_busy(calendar_ids, start_time, end_time)
            else:
                # Outlook doesn't have free/busy endpoint, use events instead
                busy_slots = {}
                for cal_id in calendar_ids:
                    events = await self.service.get_events(cal_id, start_time, end_time)
                    busy_slots[cal_id] = [
                        TimeSlot(start=event.start, end=event.end, is_available=False)
                        for event in events
                    ]
            
            return {
                "provider": self.provider.value,
                "calendars": {
                    calendar_id: [
                        {
                            "start": slot.start.isoformat(),
                            "end": slot.end.isoformat(),
                            "duration_minutes": int((slot.end - slot.start).total_seconds() / 60)
                        }
                        for slot in slots
                    ]
                    for calendar_id, slots in busy_slots.items()
                },
                "search_period": {
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat()
                }
            }
        except Exception as e:
            logger.error("get_free_busy_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to retrieve free/busy from {self.provider.value}: {str(e)}")
    
    async def create_event(self, meeting_data: Dict[str, Any], calendar_id: str = "primary") -> Dict[str, Any]:
        """Create a new event"""
        try:
            # Convert dict to MeetingCreate object if needed
            from app.schemas.meeting import MeetingCreate, AttendeeCreate
            
            attendees = []
            if meeting_data.get("attendees"):
                attendees = [AttendeeCreate(email=a["email"]) for a in meeting_data["attendees"]]
            
            meeting = MeetingCreate(
                title=meeting_data["title"],
                description=meeting_data.get("description"),
                start_time=meeting_data["start_time"],
                end_time=meeting_data["end_time"],
                location=meeting_data.get("location"),
                attendees=attendees
            )
            
            event = await self.service.create_event(meeting, calendar_id)
            return {
                "id": event.id,
                "summary": event.summary,
                "description": event.description,
                "start": event.start.isoformat(),
                "end": event.end.isoformat(),
                "location": event.location,
                "status": event.status,
                "attendees": event.attendees,
                "created": event.created.isoformat() if event.created else None,
                "provider": self.provider.value,
                "calendar_id": calendar_id
            }
        except Exception as e:
            logger.error("create_event_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to create event in {self.provider.value}: {str(e)}")
    
    async def update_event(self, event_id: str, meeting_data: Dict[str, Any], calendar_id: str = "primary") -> Dict[str, Any]:
        """Update an existing event"""
        try:
            from app.schemas.meeting import MeetingCreate, AttendeeCreate
            
            attendees = []
            if meeting_data.get("attendees"):
                attendees = [AttendeeCreate(email=a["email"]) for a in meeting_data["attendees"]]
            
            meeting = MeetingCreate(
                title=meeting_data["title"],
                description=meeting_data.get("description"),
                start_time=meeting_data["start_time"],
                end_time=meeting_data["end_time"],
                location=meeting_data.get("location"),
                attendees=attendees
            )
            
            event = await self.service.update_event(event_id, meeting, calendar_id)
            return {
                "id": event.id,
                "summary": event.summary,
                "description": event.description,
                "start": event.start.isoformat(),
                "end": event.end.isoformat(),
                "location": event.location,
                "status": event.status,
                "attendees": event.attendees,
                "updated": event.updated.isoformat() if event.updated else None,
                "provider": self.provider.value,
                "calendar_id": calendar_id
            }
        except Exception as e:
            logger.error("update_event_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to update event in {self.provider.value}: {str(e)}")
    
    async def delete_event(self, event_id: str, calendar_id: str = "primary") -> bool:
        """Delete an event"""
        try:
            success = await self.service.delete_event(event_id, calendar_id)
            logger.info("event_deleted", event_id=event_id, calendar_id=calendar_id, provider=self.provider.value)
            return success
        except Exception as e:
            logger.error("delete_event_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to delete event from {self.provider.value}: {str(e)}")
    
    async def sync_events(self, calendar_id: str = "primary", days_back: int = 30, days_forward: int = 30) -> Dict[str, Any]:
        """Sync events from calendar (useful for initial sync or periodic updates)"""
        try:
            start_time = datetime.now(timezone.utc) - timedelta(days=days_back)
            end_time = datetime.now(timezone.utc) + timedelta(days=days_forward)
            
            events = await self.get_events(calendar_id, start_time, end_time)
            
            return {
                "provider": self.provider.value,
                "calendar_id": calendar_id,
                "sync_period": {
                    "start": start_time.isoformat(),
                    "end": end_time.isoformat()
                },
                "events_synced": len(events),
                "events": events
            }
        except Exception as e:
            logger.error("sync_events_failed", error=str(e), provider=self.provider.value)
            raise Exception(f"Failed to sync events from {self.provider.value}: {str(e)}")

# Factory function for creating calendar integration service
def create_calendar_service(user_id: str, provider: str, db_session) -> CalendarIntegrationService:
    """Create calendar integration service for the specified provider"""
    return CalendarIntegrationService(user_id, provider, db_session)
