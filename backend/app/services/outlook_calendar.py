from typing import List
from datetime import datetime
from app.services.calendar_provider import CalendarProvider, TimeSlot
from app.schemas.meeting import MeetingCreate
import httpx


class OutlookCalendarAdapter(CalendarProvider):
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://graph.microsoft.com/v1.0"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
    
    async def get_free_busy(self, start: datetime, end: datetime, attendees: List[str]) -> List[TimeSlot]:
        """Get free/busy information from Microsoft Graph API."""
        async with httpx.AsyncClient() as client:
            # Use getSchedule endpoint for availability
            body = {
                "schedules": attendees,
                "startTime": {
                    "dateTime": start.isoformat(),
                    "timeZone": "UTC"
                },
                "endTime": {
                    "dateTime": end.isoformat(),
                    "timeZone": "UTC"
                },
                "availabilityViewInterval": 30
            }
            
            response = await client.post(
                f"{self.base_url}/me/calendar/getSchedule",
                headers=self.headers,
                json=body
            )
            
            if response.status_code != 200:
                raise Exception(f"Outlook Calendar API error: {response.text}")
            
            data = response.json()
            busy_slots = []
            
            for schedule in data.get("value", []):
                for item in schedule.get("scheduleItems", []):
                    if item.get("status") in ["busy", "tentative", "oof"]:
                        start_time = datetime.fromisoformat(item["start"]["dateTime"].replace("Z", "+00:00"))
                        end_time = datetime.fromisoformat(item["end"]["dateTime"].replace("Z", "+00:00"))
                        busy_slots.append(TimeSlot(start=start_time, end=end_time))
            
            return busy_slots
    
    async def create_event(self, meeting: MeetingCreate) -> str:
        """Create an event in Outlook Calendar."""
        async with httpx.AsyncClient() as client:
            event_body = {
                "subject": meeting.title,
                "body": {
                    "contentType": "Text",
                    "content": meeting.description or ""
                },
                "start": {
                    "dateTime": meeting.start_time.isoformat(),
                    "timeZone": "UTC"
                },
                "end": {
                    "dateTime": meeting.end_time.isoformat(),
                    "timeZone": "UTC"
                },
                "attendees": [
                    {
                        "emailAddress": {
                            "address": a.email
                        },
                        "type": "required"
                    } for a in (meeting.attendees or [])
                ]
            }
            
            response = await client.post(
                f"{self.base_url}/me/calendar/events",
                headers=self.headers,
                json=event_body
            )
            
            if response.status_code != 201:
                raise Exception(f"Outlook Calendar API error: {response.text}")
            
            return response.json()["id"]
    
    async def delete_event(self, external_event_id: str) -> bool:
        """Delete an event from Outlook Calendar."""
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{self.base_url}/me/calendar/events/{external_event_id}",
                headers=self.headers
            )
            
            return response.status_code == 204
    
    async def update_event(self, external_event_id: str, meeting: MeetingCreate) -> bool:
        """Update an event in Outlook Calendar."""
        async with httpx.AsyncClient() as client:
            event_body = {
                "subject": meeting.title,
                "body": {
                    "contentType": "Text",
                    "content": meeting.description or ""
                },
                "start": {
                    "dateTime": meeting.start_time.isoformat(),
                    "timeZone": "UTC"
                },
                "end": {
                    "dateTime": meeting.end_time.isoformat(),
                    "timeZone": "UTC"
                },
                "attendees": [
                    {
                        "emailAddress": {
                            "address": a.email
                        },
                        "type": "required"
                    } for a in (meeting.attendees or [])
                ]
            }
            
            response = await client.patch(
                f"{self.base_url}/me/calendar/events/{external_event_id}",
                headers=self.headers,
                json=event_body
            )
            
            return response.status_code == 200
