"""
Microsoft Outlook Calendar API adapter implementing the CalendarProvider interface.
"""
from datetime import datetime, timezone
from typing import List, Optional

import httpx

from app.services.calendar_provider import CalendarProvider, TimeSlot


class OutlookCalendarAdapter(CalendarProvider):
    """Microsoft Outlook Calendar adapter using Graph API."""
    
    BASE_URL = "https://graph.microsoft.com/v1.0"
    
    def __init__(self, access_token: str):
        """
        Initialize the Outlook Calendar adapter.
        
        Args:
            access_token: OAuth access token for Microsoft Graph API.
        """
        self.access_token = access_token
        self._headers = {"Authorization": f"Bearer {access_token}"}
    
    async def get_free_busy(
        self,
        start: datetime,
        end: datetime,
        attendees: Optional[List[str]] = None,
    ) -> List[TimeSlot]:
        """
        Get busy time slots from Outlook Calendar.
        
        Args:
            start: Start of time window (UTC).
            end: End of time window (UTC).
            attendees: Optional attendee emails to check.
            
        Returns:
            List of busy TimeSlot objects.
        """
        # Build request for getSchedule endpoint
        payload = {
            "startTime": {"dateTime": start.isoformat(), "timeZone": "UTC"},
            "endTime": {"dateTime": end.isoformat(), "timeZone": "UTC"},
            "availabilityViewInterval": 60,  # 60-minute intervals
        }
        
        # Include user's own calendar plus attendees
        emails = ["me"]
        if attendees:
            emails.extend(attendees)
        
        payload["emails"] = emails
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/me/calendar/getSchedule",
                headers=self._headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
        
        busy_slots = []
        
        # Parse availability view and error information
        schedules = data.get("schedulesResponse", {}).get("schedules", [])
        
        for schedule in schedules:
            availability_view = schedule.get("availabilityView", "")
            
            # Availability view uses: 0=free, 1=tentative, 2=busy, 3=OOF
            # Each character represents one interval (60 min by default)
            current_time = start
            
            for char in availability_view:
                if char in ["2", "3"]:  # Busy or Out of Office
                    slot_end = current_time.replace(minute=0, second=0, microsecond=0)
                    slot_end = slot_end.replace(hour=current_time.hour + 1) if current_time.hour < 23 else slot_end
                    
                    busy_slots.append(TimeSlot(start=current_time, end=slot_end))
                
                current_time = current_time.replace(minute=0, second=0, microsecond=0)
                current_time = current_time.replace(hour=current_time.hour + 1) if current_time.hour < 23 else current_time
        
        # Also fetch actual events for more precise busy times
        params = {
            "$select": "start,end,subject",
            "$filter": f"start/dateTime ge '{start.isoformat()}' and end/dateTime le '{end.isoformat()}'",
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/me/events",
                headers=self._headers,
                params=params,
            )
            response.raise_for_status()
            events_data = response.json()
        
        for event in events_data.get("value", []):
            event_start = datetime.fromisoformat(event["start"]["dateTime"].replace("Z", "+00:00"))
            event_end = datetime.fromisoformat(event["end"]["dateTime"].replace("Z", "+00:00"))
            busy_slots.append(TimeSlot(start=event_start, end=event_end))
        
        return busy_slots
    
    async def create_event(
        self,
        title: str,
        start_time: datetime,
        end_time: datetime,
        description: Optional[str] = None,
        attendees: Optional[List[str]] = None,
    ) -> str:
        """Create an Outlook Calendar event."""
        event = {
            "subject": title,
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
            event["body"] = {
                "contentType": "text",
                "content": description,
            }
        
        if attendees:
            event["attendees"] = [
                {
                    "emailAddress": {"address": email},
                    "type": "required",
                }
                for email in attendees
            ]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/me/events",
                headers=self._headers,
                json=event,
            )
            response.raise_for_status()
            data = response.json()
        
        return data["id"]
    
    async def delete_event(self, external_event_id: str) -> bool:
        """Delete an Outlook Calendar event."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.BASE_URL}/me/events/{external_event_id}",
                headers=self._headers,
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
        """Update an Outlook Calendar event."""
        event_updates = {}
        
        if title:
            event_updates["subject"] = title
        
        if start_time:
            event_updates["start"] = {
                "dateTime": start_time.isoformat(),
                "timeZone": "UTC",
            }
        
        if end_time:
            event_updates["end"] = {
                "dateTime": end_time.isoformat(),
                "timeZone": "UTC",
            }
        
        if description is not None:
            event_updates["body"] = {
                "contentType": "text",
                "content": description,
            }
        
        if attendees is not None:
            event_updates["attendees"] = [
                {
                    "emailAddress": {"address": email},
                    "type": "required",
                }
                for email in attendees
            ]
        
        async with httpx.AsyncClient() as client:
            response = await client.patch(
                f"{self.BASE_URL}/me/events/{external_event_id}",
                headers=self._headers,
                json=event_updates,
            )
            response.raise_for_status()
        
        return True
