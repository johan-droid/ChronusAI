from typing import List
from datetime import datetime
from app.services.calendar_provider import CalendarProvider, TimeSlot
from app.schemas.meeting import MeetingCreate
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
