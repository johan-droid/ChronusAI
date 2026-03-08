import uuid
from typing import List, Optional
from datetime import datetime, timezone
from app.services.calendar_provider import CalendarProvider, TimeSlot, CreateEventResult
from app.schemas.meeting import MeetingCreate, Attendee
import httpx
import structlog
import asyncio

logger = structlog.get_logger()


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
        """List events from Google Calendar with enhanced error handling."""
        logger.info("Fetching Google Calendar events", start=start.isoformat(), end=end.isoformat())
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                params = {
                    "timeMin": start.isoformat(),
                    "timeMax": end.isoformat(),
                    "singleEvents": "true",
                    "orderBy": "startTime",
                    "maxResults": 250  # Limit results for performance
                }
                
                response = await client.get(
                    f"{self.base_url}/calendars/primary/events",
                    headers=self.headers,
                    params=params
                )
                
                if response.status_code == 401:
                    logger.error("Google Calendar authentication failed - token may be expired")
                    raise Exception("Authentication failed - please re-authenticate with Google")
                elif response.status_code == 403:
                    logger.error("Google Calendar access forbidden - insufficient permissions")
                    raise Exception("Insufficient permissions - check OAuth scopes")
                elif response.status_code == 429:
                    logger.error("Google Calendar rate limit exceeded")
                    raise Exception("Rate limit exceeded - please try again later")
                elif response.status_code != 200:
                    logger.error("Google Calendar API error", status_code=response.status_code, response=response.text)
                    raise Exception(f"Google Calendar API error: {response.status_code} - {response.text}")
                
                data = response.json()
                events = []
                
                for item in data.get("items", []):
                    try:
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
                    except Exception as e:
                        logger.warning("Error parsing event", event_id=item.get("id"), error=str(e))
                        continue
                
                logger.info("Successfully fetched Google Calendar events", count=len(events))
                return events
                
        except httpx.TimeoutError:
            logger.error("Google Calendar API timeout")
            raise Exception("Google Calendar API timeout - please try again")
        except httpx.NetworkError as e:
            logger.error("Google Calendar network error", error=str(e))
            raise Exception("Network error connecting to Google Calendar API")
        except Exception as e:
            logger.error("Unexpected error in Google Calendar API", error=str(e))
            raise Exception(f"Unexpected error: {str(e)}")
    
    def _parse_datetime(self, datetime_obj: dict) -> datetime:
        """Parse datetime object from Google Calendar API response with enhanced error handling."""
        try:
            if not datetime_obj:
                logger.warning("Empty datetime object, using current time")
                return datetime.now(timezone.utc)
            
            if "dateTime" in datetime_obj:
                return datetime.fromisoformat(datetime_obj["dateTime"].replace("Z", "+00:00"))
            elif "date" in datetime_obj:
                # All-day event, set to midnight UTC
                date_str = datetime_obj["date"]
                return datetime.fromisoformat(date_str).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0)
            else:
                logger.warning("Unknown datetime format, using current time")
                return datetime.now(timezone.utc)
        except Exception as e:
            logger.error("Error parsing datetime", datetime_obj=datetime_obj, error=str(e))
            return datetime.now(timezone.utc)
    
    async def create_event(
        self,
        meeting: MeetingCreate,
        *,
        add_video_conference: Optional[str] = None,
    ) -> CreateEventResult:
        """Create an event in Google Calendar. add_video_conference='google_meet' adds a Meet link (Google policy: conferenceData)."""
        async with httpx.AsyncClient() as client:
            event_body = {
                "summary": meeting.title,
                "description": meeting.description or "",
                "start": {
                    "dateTime": meeting.start_time.isoformat(),
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": meeting.end_time.isoformat(),
                    "timeZone": "UTC",
                },
                "attendees": [{"email": a.email} for a in (meeting.attendees or [])],
            }
            if add_video_conference == "google_meet":
                event_body["conferenceData"] = {
                    "createRequest": {
                        "requestId": str(uuid.uuid4()),
                        "conferenceSolutionKey": {"type": "hangoutsMeet"},
                    }
                }
            params = {}
            if add_video_conference == "google_meet":
                params["conferenceDataVersion"] = "1"

            response = await client.post(
                f"{self.base_url}/calendars/primary/events",
                headers=self.headers,
                params=params or None,
                json=event_body,
            )

            if response.status_code != 200:
                raise Exception(f"Google Calendar API error: {response.text}")

            data = response.json()
            event_id = data["id"]
            meeting_url = None
            entry_points = (data.get("conferenceData") or {}).get("entryPoints") or []
            for ep in entry_points:
                if ep.get("entryPointType") == "video":
                    meeting_url = ep.get("uri")
                    break
            return CreateEventResult(event_id=event_id, meeting_url=meeting_url)
    
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
