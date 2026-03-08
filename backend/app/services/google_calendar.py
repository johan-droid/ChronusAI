from typing import List
from datetime import datetime, timezone
from app.services.calendar_provider import CalendarProvider, TimeSlot
from app.schemas.meeting import MeetingCreate, Attendee
import httpx


class GoogleCalendarAdapter(CalendarProvider):
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://www.googleapis.com/calendar/v3"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    async def get_free_busy(self, start: datetime, end: datetime, attendees: List[str]) -> List[TimeSlot]:
        """Get free/busy information from Google Calendar API."""
        async with httpx.AsyncClient() as client:
            # Convert to required format
            body = {
                "timeMin": start.isoformat(),
                "timeMax": end.isoformat(),
                "items": [{"id": email} for email in attendees]
            }
            
            response = await client.post(
                f"{self.base_url}/freeBusy",
                headers=self.headers,
                json=body
            )
            
            if response.status_code != 200:
                raise Exception(f"Google Calendar API error: {response.text}")
            
            data = response.json()
            busy_slots = []
            
            for calendar in data.get("calendars", {}).values():
                for busy in calendar.get("busy", []):
                    start_time = datetime.fromisoformat(busy["start"].replace("Z", "+00:00"))
                    end_time = datetime.fromisoformat(busy["end"].replace("Z", "+00:00"))
                    busy_slots.append(TimeSlot(start=start_time, end=end_time))
            
            return busy_slots
    
    async def list_events(self, start: datetime, end: datetime) -> List[dict]:
        """List events from Google Calendar."""
        async with httpx.AsyncClient() as client:
            params = {
                "timeMin": start.isoformat(),
                "timeMax": end.isoformat(),
                "singleEvents": "true",
                "orderBy": "startTime"
            }
            
            response = await client.get(
                f"{self.base_url}/calendars/primary/events",
                headers=self.headers,
                params=params
            )
            
            if response.status_code != 200:
                raise Exception(f"Google Calendar API error: {response.text}")
            
            data = response.json()
            events = []
            
            for item in data.get("items", []):
                event = {
                    "id": item.get("id"),
                    "summary": item.get("summary", "No Title"),
                    "description": item.get("description", ""),
                    "start": self._parse_datetime(item.get("start")),
                    "end": self._parse_datetime(item.get("end")),
                    "attendees": [
                        Attendee(email=attendee.get("email")) 
                        for attendee in item.get("attendees", [])
                    ] if item.get("attendees") else []
                }
                events.append(event)
            
            return events
    
    def _parse_datetime(self, datetime_obj: dict) -> datetime:
        """Parse datetime object from Google Calendar API response."""
        if not datetime_obj:
            return datetime.now(timezone.utc)
        
        if "dateTime" in datetime_obj:
            return datetime.fromisoformat(datetime_obj["dateTime"].replace("Z", "+00:00"))
        elif "date" in datetime_obj:
            # All-day event, set to midnight UTC
            date_str = datetime_obj["date"]
            return datetime.fromisoformat(date_str).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0)
        else:
            return datetime.now(timezone.utc)
    
    async def create_event(self, meeting: MeetingCreate) -> str:
        """Create an event in Google Calendar."""
        async with httpx.AsyncClient() as client:
            event_body = {
                "summary": meeting.title,
                "description": meeting.description,
                "start": {
                    "dateTime": meeting.start_time.isoformat(),
                    "timeZone": "UTC"
                },
                "end": {
                    "dateTime": meeting.end_time.isoformat(),
                    "timeZone": "UTC"
                },
                "attendees": [{"email": a.email} for a in (meeting.attendees or [])],
            }
            
            response = await client.post(
                f"{self.base_url}/calendars/primary/events",
                headers=self.headers,
                json=event_body
            )
            
            if response.status_code != 200:
                raise Exception(f"Google Calendar API error: {response.text}")
            
            return response.json()["id"]
    
    async def delete_event(self, external_event_id: str) -> bool:
        """Delete an event from Google Calendar."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/calendars/primary/events/{external_event_id}",
                headers=self.headers
            )
            
            return response.status_code == 204
    
    async def update_event(self, external_event_id: str, meeting: MeetingCreate) -> bool:
        """Update an event in Google Calendar."""
        async with httpx.AsyncClient() as client:
            event_body = {
                "summary": meeting.title,
                "description": meeting.description,
                "start": {
                    "dateTime": meeting.start_time.isoformat(),
                    "timeZone": "UTC"
                },
                "end": {
                    "dateTime": meeting.end_time.isoformat(),
                    "timeZone": "UTC"
                },
                "attendees": [{"email": a.email} for a in (meeting.attendees or [])],
            }
            
            response = await client.put(
                f"{self.base_url}/calendars/primary/events/{external_event_id}",
                headers=self.headers,
                json=event_body
            )
            
            return response.status_code == 200
