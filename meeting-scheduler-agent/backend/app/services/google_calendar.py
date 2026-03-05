"""
Google Calendar API adapter implementing the CalendarProvider interface.
"""
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from app.services.calendar_provider import CalendarProvider, TimeSlot


class GoogleCalendarAdapter(CalendarProvider):
    """Google Calendar API adapter."""
    
    BASE_URL = "https://www.googleapis.com/calendar/v3"
    FREE_BUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy"
    
    def __init__(self, access_token: str):
        """
        Initialize the Google Calendar adapter.
        
        Args:
            access_token: OAuth access token for Google API.
        """
        self.access_token = access_token
        self._headers = {"Authorization": f"Bearer {access_token}"}
    
    async def _get_primary_calendar_id(self) -> str:
        """Get the primary calendar ID (user's email)."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/users/me/calendarList",
                headers=self._headers,
                params={"minAccessRole": "owner"},
            )
            response.raise_for_status()
            data = response.json()
            
            # Return first calendar the user owns
            if data.get("items"):
                return data["items"][0]["id"]
            
            return "primary"
    
    async def get_free_busy(
        self,
        start: datetime,
        end: datetime,
        attendees: Optional[List[str]] = None,
    ) -> List[TimeSlot]:
        """
        Get busy time slots from Google Calendar.
        
        Args:
            start: Start of time window (UTC).
            end: End of time window (UTC).
            attendees: Optional attendee emails to check.
            
        Returns:
            List of busy TimeSlot objects.
        """
        calendar_ids = ["primary"]
        if attendees:
            calendar_ids.extend(attendees)
        
        payload = {
            "timeMin": start.isoformat(),
            "timeMax": end.isoformat(),
            "items": [{"id": cid} for cid in calendar_ids],
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.FREE_BUSY_URL,
                headers=self._headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        busy_slots = []
        calendars = data.get("calendars", {})
        
        for calendar_data in calendars.values():
            for busy in calendar_data.get("busy", []):
                busy_start = datetime.fromisoformat(busy["start"].replace("Z", "+00:00"))
                busy_end = datetime.fromisoformat(busy["end"].replace("Z", "+00:00"))
                busy_slots.append(TimeSlot(start=busy_start, end=busy_end))
        
        return busy_slots
    
    async def create_event(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> str:
        """Create a Google Calendar event."""
        event = {
            "summary": title,
            "start": {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC",
            },
            "end": {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC",
            },
        }
        
        if description:
            event["description"] = description
        
        if attendees:
            event["attendees"] = [{"email": email} for email in attendees]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/calendars/primary/events",
                headers=self._headers,
                params={"sendUpdates": "all"},  # Send invites
                json=event,
            )
            response.raise_for_status()
            data = response.json()
        
        return data["id"]
    
    async def delete_event(self, external_event_id: str) -> bool:
        """Delete a Google Calendar event."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.BASE_URL}/calendars/primary/events/{external_event_id}",
                headers=self._headers,
                params={"sendUpdates": "all"},
            )
            response.raise_for_status()
        
        return True
    
    async def update_event(
        self,
        external_event_id: str,
        title: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        description: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> bool:
        """Update a Google Calendar event."""
        # First, get the existing event
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/calendars/primary/events/{external_event_id}",
                headers=self._headers,
            )
            response.raise_for_status()
            event = response.json()
        
        # Update fields
        if title:
            event["summary"] = title
        if start_time:
            event["start"] = {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC",
            }
        if end_time:
            event["end"] = {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC",
            }
        if description is not None:
            event["description"] = description
        if attendees is not None:
            event["attendees"] = [{"email": email} for email in attendees]
        
        # Update the event
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.BASE_URL}/calendars/primary/events/{external_event_id}",
                headers=self._headers,
                params={"sendUpdates": "all"},
                json=event,
            )
            response.raise_for_status()
        
        return True
