"""
Enhanced Google Calendar API Service
Provides comprehensive integration with Google Calendar API v3
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from dataclasses import dataclass
import httpx
import structlog
from app.schemas.meeting import MeetingCreate
from app.core.security import token_encryptor

logger = structlog.get_logger()

@dataclass
class CalendarEvent:
    """Google Calendar event representation"""
    id: str
    summary: str
    description: Optional[str]
    start: datetime
    end: datetime
    attendees: List[Dict[str, Any]]
    location: Optional[str] = None
    status: str = "confirmed"
    created: Optional[datetime] = None
    updated: Optional[datetime] = None

@dataclass
class TimeSlot:
    """Time slot for availability checking"""
    start: datetime
    end: datetime
    is_available: bool = True

@dataclass
class CalendarInfo:
    """Calendar information"""
    id: str
    summary: str
    description: Optional[str]
    timezone: str
    access_role: str
    primary: bool = False

class GoogleCalendarService:
    """Enhanced Google Calendar API service"""
    
    def __init__(self, user_id: str, db_session, user_timezone: str = "UTC"):
        self.user_id = user_id
        self.db = db_session
        self.base_url = "https://www.googleapis.com/calendar/v3"
        self._access_token = None
        self._token_expires_at = None
        self.user_timezone = user_timezone
    
    async def _get_access_token(self) -> str:
        """Get valid access token, refreshing if necessary"""
        from app.models.oauth_credential import OAuthCredential
        from sqlalchemy import select
        
        # Check if we have a cached token that's still valid
        if self._access_token and self._token_expires_at and datetime.now(timezone.utc) < self._token_expires_at:
            return self._access_token
        
        # Get OAuth credentials from database
        result = await self.db.execute(
            select(OAuthCredential).where(OAuthCredential.user_id == self.user_id)
        )
        oauth_cred = result.scalar_one_or_none()
        
        if not oauth_cred:
            raise Exception("No OAuth credentials found for user")
        
        # Decrypt access token
        access_token = token_encryptor.decrypt(oauth_cred.access_token)
        
        # Check if token needs refresh
        if oauth_cred.expires_at and datetime.now(timezone.utc) >= oauth_cred.expires_at - timedelta(minutes=5):
            if oauth_cred.refresh_token:
                refresh_token = token_encryptor.decrypt(oauth_cred.refresh_token)
                refreshed_token = await self._refresh_access_token(refresh_token)
                access_token = refreshed_token["access_token"]
                
                # Update stored token
                oauth_cred.access_token = token_encryptor.encrypt(access_token)
                expires_in = refreshed_token.get("expires_in", 3600)
                oauth_cred.expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                await self.db.commit()
            else:
                raise Exception("Access token expired and no refresh token available")
        
        # Cache token
        self._access_token = access_token
        self._token_expires_at = oauth_cred.expires_at
        
        return access_token
    
    async def _refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh access token using refresh token"""
        from app.config import settings
        
        data = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://oauth2.googleapis.com/token",
                data=data
            )
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            return response.json()
    
    @property
    def _headers(self) -> Dict[str, str]:
        """Get request headers with authorization"""
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    async def get_calendar_list(self) -> List[CalendarInfo]:
        """Get list of user's calendars"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/users/me/calendarList",
                headers=self._headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to get calendar list: {response.text}")
            
            data = response.json()
            calendars = []
            
            for item in data.get("items", []):
                calendar = CalendarInfo(
                    id=item["id"],
                    summary=item.get("summary", ""),
                    description=item.get("description"),
                    timezone=item.get("timeZone", "UTC"),
                    access_role=item.get("accessRole", ""),
                    primary=item.get("primary", False)
                )
                calendars.append(calendar)
            
            return calendars
    
    async def get_events(
        self,
        calendar_id: str = "primary",
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None
    ) -> List[CalendarEvent]:
        """Get events from calendar"""
        async with httpx.AsyncClient() as client:
            # Default to last 30 days and next 30 days if not specified
            if not start_time:
                start_time = datetime.now(timezone.utc) - timedelta(days=30)
            if not end_time:
                end_time = datetime.now(timezone.utc) + timedelta(days=30)
            
            params = {
                "timeMin": start_time.isoformat(),
                "timeMax": end_time.isoformat(),
                "maxResults": 100,
                "singleEvents": "true",
                "orderBy": "startTime"
            }
            
            response = await client.get(
                f"{self.base_url}/calendars/{calendar_id}/events",
                headers=self._headers,
                params=params
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to get events: {response.text}")
            
            data = response.json()
            events = []
            
            for item in data.get("items", []):
                # Skip cancelled events
                if item.get("status") == "cancelled":
                    continue
                
                # Parse start and end times
                start_data = item.get("start", {})
                end_data = item.get("end", {})
                
                if "dateTime" in start_data:
                    start_time = datetime.fromisoformat(start_data["dateTime"].replace("Z", "+00:00"))
                else:
                    # All-day event
                    start_time = datetime.fromisoformat(start_data["date"])
                
                if "dateTime" in end_data:
                    end_time = datetime.fromisoformat(end_data["dateTime"].replace("Z", "+00:00"))
                else:
                    # All-day event
                    end_time = datetime.fromisoformat(end_data["date"])
                
                event = CalendarEvent(
                    id=item["id"],
                    summary=item.get("summary", ""),
                    description=item.get("description"),
                    start=start_time,
                    end=end_time,
                    attendees=item.get("attendees", []),
                    location=item.get("location"),
                    status=item.get("status", "confirmed"),
                    created=datetime.fromisoformat(item["created"].replace("Z", "+00:00")) if item.get("created") else None,
                    updated=datetime.fromisoformat(item["updated"].replace("Z", "+00:00")) if item.get("updated") else None
                )
                events.append(event)
            
            return events
    
    async def get_free_busy(
        self,
        calendar_ids: List[str],
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, List[TimeSlot]]:
        """Get free/busy information for multiple calendars"""
        body = {
            "timeMin": start_time.isoformat(),
            "timeMax": end_time.isoformat(),
            "items": [{"id": cal_id} for cal_id in calendar_ids]
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/freeBusy",
                headers=self._headers,
                json=body
            )
            
            if response.status_code != 200:
                raise Exception(f"Free/busy query failed: {response.text}")
            
            data = response.json()
            results = {}
            
            for calendar_id, calendar_data in data.get("calendars", {}).items():
                busy_slots = []
                
                for busy in calendar_data.get("busy", []):
                    start_dt = datetime.fromisoformat(busy["start"].replace("Z", "+00:00"))
                    end_dt = datetime.fromisoformat(busy["end"].replace("Z", "+00:00"))
                    busy_slots.append(TimeSlot(start=start_dt, end=end_dt, is_available=False))
                
                results[calendar_id] = busy_slots
            
            return results
    
    async def create_event(self, meeting: MeetingCreate, calendar_id: str = "primary") -> CalendarEvent:
        """Create a new event"""
        event_data = {
            "summary": meeting.title,
            "description": meeting.description or "",
            "start": {
                "dateTime": meeting.start_time.isoformat(),
                "timeZone": self.user_timezone
            },
            "end": {
                "dateTime": meeting.end_time.isoformat(),
                "timeZone": self.user_timezone
            },
            "attendees": [{"email": a.email} for a in (meeting.attendees or [])],
            "reminders": {
                "useDefault": True,
                "overrides": [
                    {"method": "email", "minutes": 24 * 60},  # 1 day before
                    {"method": "popup", "minutes": 30}  # 30 minutes before
                ]
            }
        }
        
        if meeting.location:
            event_data["location"] = meeting.location
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/calendars/{calendar_id}/events",
                headers=self._headers,
                json=event_data
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to create event: {response.text}")
            
            data = response.json()
            
            return CalendarEvent(
                id=data["id"],
                summary=data["summary"],
                description=data.get("description"),
                start=datetime.fromisoformat(data["start"]["dateTime"].replace("Z", "+00:00")),
                end=datetime.fromisoformat(data["end"]["dateTime"].replace("Z", "+00:00")),
                attendees=data.get("attendees", []),
                location=data.get("location"),
                status=data.get("status", "confirmed"),
                created=datetime.fromisoformat(data["created"].replace("Z", "+00:00")) if data.get("created") else None,
                updated=datetime.fromisoformat(data["updated"].replace("Z", "+00:00")) if data.get("updated") else None
            )
    
    async def update_event(self, event_id: str, meeting: MeetingCreate, calendar_id: str = "primary") -> CalendarEvent:
        """Update an existing event"""
        event_body = {
            "summary": meeting.title,
            "description": meeting.description or "",
            "start": {
                "dateTime": meeting.start_time.isoformat(),
                "timeZone": self.user_timezone
            },
            "end": {
                "dateTime": meeting.end_time.isoformat(),
                "timeZone": self.user_timezone
            },
            "attendees": [{"email": a.email} for a in (meeting.attendees or [])]
        }
        
        if meeting.location:
            event_body["location"] = meeting.location
        
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                headers=self._headers,
                json=event_body
            )
            
            if response.status_code != 200:
                raise Exception(f"Failed to update event: {response.text}")
            
            data = response.json()
            
            return CalendarEvent(
                id=data["id"],
                summary=data["summary"],
                description=data.get("description"),
                start=datetime.fromisoformat(data["start"]["dateTime"].replace("Z", "+00:00")),
                end=datetime.fromisoformat(data["end"]["dateTime"].replace("Z", "+00:00")),
                attendees=data.get("attendees", []),
                location=data.get("location"),
                status=data.get("status", "confirmed"),
                updated=datetime.fromisoformat(data["updated"].replace("Z", "+00:00")) if data.get("updated") else None
            )
    
    async def delete_event(self, event_id: str, calendar_id: str = "primary") -> bool:
        """Delete an event"""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/calendars/{calendar_id}/events/{event_id}",
                headers=self._headers
            )
            
            return response.status_code == 204
    
    async def get_availability(
        self,
        calendar_ids: Optional[List[str]] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        duration_minutes: int = 30
    ) -> List[TimeSlot]:
        """Get available time slots for scheduling"""
        if not calendar_ids:
            # Get primary calendar
            calendar_ids = ["primary"]
        
        if not start_time:
            start_time = datetime.now(timezone.utc)
        if not end_time:
            end_time = start_time + timedelta(days=7)
        
        # Get free/busy information
        busy_slots_by_calendar = await self.get_free_busy(calendar_ids, start_time, end_time)
        
        # Merge all busy slots
        all_busy_slots = []
        for slots in busy_slots_by_calendar.values():
            all_busy_slots.extend(slots)
        
        # Sort busy slots by start time
        all_busy_slots.sort(key=lambda x: x.start)
        
        # Find available slots
        available_slots = []
        current_time = start_time
        
        while current_time < end_time:
            # Find next busy slot
            next_busy = None
            for busy in all_busy_slots:
                if busy.start > current_time:
                    next_busy = busy
                    break
                elif busy.start <= current_time < busy.end:
                    next_busy = busy
                    break
            
            if next_busy:
                if next_busy.start > current_time:
                    # Available slot before next busy
                    slot_end = min(next_busy.start, current_time + timedelta(hours=2))
                    if (slot_end - current_time) >= timedelta(minutes=duration_minutes):
                        available_slots.append(TimeSlot(start=current_time, end=slot_end, is_available=True))
                
                # Move to after busy slot
                current_time = max(current_time, next_busy.end)
            else:
                # No more busy slots, remaining time is available
                slot_end = min(end_time, current_time + timedelta(hours=2))
                if (slot_end - current_time) >= timedelta(minutes=duration_minutes):
                    available_slots.append(TimeSlot(start=current_time, end=slot_end, is_available=True))
                break
        
        return available_slots
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test connection to Google Calendar API"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/users/me/calendarList",
                    headers=self._headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "success",
                        "calendars_found": len(data.get("items", [])),
                        "primary_calendar": next((item for item in data.get("items", []) if item.get("primary")), None)
                    }
                else:
                    return {
                        "status": "error",
                        "error": f"API request failed: {response.status_code}",
                        "details": response.text
                    }
        
        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }
