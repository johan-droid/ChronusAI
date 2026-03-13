"""
Calendar API endpoints for Google Calendar integration
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.db.session import get_db
from app.models.user import User
from app.services.google_calendar_service import GoogleCalendarService
from app.schemas.meeting import MeetingCreate
from app.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

logger = structlog.get_logger()

router = APIRouter(prefix="/calendar", tags=["calendar"])


def _get_oauth_access_token(request: Request) -> str:
    """Read OAuth access token attached by middleware for calendar API calls."""
    access_token = getattr(request.state, "oauth_access_token", None)
    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Google OAuth token is missing or expired. Please reconnect Google Calendar."
        )
    return str(access_token)


def _raise_calendar_error(exc: Exception, default_detail: str) -> None:
    """Normalize provider/auth failures into user-facing HTTP errors."""
    error_text = str(exc)
    auth_markers = ("Invalid Credentials", "UNAUTHENTICATED", "401", "authError")
    if any(marker in error_text for marker in auth_markers):
        raise HTTPException(
            status_code=401,
            detail="Google authentication expired or is invalid. Please reconnect your Google account."
        )
    raise HTTPException(status_code=500, detail=default_detail)

@router.get("/test-connection")
async def test_connection(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Test connection to Google Calendar API"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        result = await service.test_connection()
        
        if result["status"] == "error":
            raise HTTPException(
                status_code=400,
                detail=f"Google Calendar connection failed: {result['error']}"
            )
        
        return {
            "status": "connected",
            "calendars_found": result["calendars_found"],
            "primary_calendar": result["primary_calendar"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("calendar_connection_test_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to test calendar connection")

@router.get("/calendars")
async def get_calendars(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get list of user's calendars"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        calendars = await service.get_calendar_list()
        
        return {
            "calendars": [
                {
                    "id": cal.id,
                    "summary": cal.summary,
                    "description": cal.description,
                    "timezone": cal.timezone,
                    "primary": cal.primary,
                    "access_role": cal.access_role
                }
                for cal in calendars
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_calendars_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to retrieve calendars")

@router.get("/events")
async def get_events(
    request: Request,
    calendar_id: str = Query(default="primary", description="Calendar ID to fetch events from"),
    start_time: Optional[datetime] = Query(default=None, description="Start time for events (ISO format)"),
    end_time: Optional[datetime] = Query(default=None, description="End time for events (ISO format)"),
    max_results: int = Query(default=250, ge=1, le=2500, description="Maximum number of events to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get events from calendar"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        events = await service.get_events(calendar_id, start_time, end_time, max_results)
        
        return {
            "events": [
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
                    "updated": event.updated.isoformat() if event.updated else None
                }
                for event in events
            ],
            "total": len(events)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_events_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to retrieve events")

@router.get("/availability")
async def get_availability(
    request: Request,
    calendar_ids: Optional[List[str]] = Query(default=None, description="Calendar IDs to check"),
    start_time: Optional[datetime] = Query(default=None, description="Start time for availability check (ISO format)"),
    end_time: Optional[datetime] = Query(default=None, description="End time for availability check (ISO format)"),
    duration_minutes: int = Query(default=30, ge=15, le=480, description="Duration of meeting in minutes"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get available time slots for scheduling"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        available_slots = await service.get_availability(calendar_ids, start_time, end_time, duration_minutes)
        
        return {
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
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_availability_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to retrieve availability")

@router.get("/free-busy")
async def get_free_busy(
    request: Request,
    calendar_ids: List[str] = Query(..., description="Calendar IDs to check"),
    start_time: datetime = Query(..., description="Start time for free/busy check (ISO format)"),
    end_time: datetime = Query(..., description="End time for free/busy check (ISO format)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get free/busy information for calendars"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        busy_slots = await service.get_free_busy(calendar_ids, start_time, end_time)
        
        return {
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
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_free_busy_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to retrieve free/busy information")

@router.post("/events")
async def create_event(
    request: Request,
    meeting: MeetingCreate,
    calendar_id: str = Query(default="primary", description="Calendar ID to create event in"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new event"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        event = await service.create_event(meeting, calendar_id)
        
        return {
            "event": {
                "id": event.id,
                "summary": event.summary,
                "description": event.description,
                "start": event.start.isoformat(),
                "end": event.end.isoformat(),
                "location": event.location,
                "status": event.status,
                "attendees": event.attendees,
                "created": event.created.isoformat() if event.created else None
            },
            "message": "Event created successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("create_event_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to create event")

@router.put("/events/{event_id}")
async def update_event(
    request: Request,
    event_id: str,
    meeting: MeetingCreate,
    calendar_id: str = Query(default="primary", description="Calendar ID to update event in"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an existing event"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        event = await service.update_event(event_id, meeting, calendar_id)
        
        return {
            "event": {
                "id": event.id,
                "summary": event.summary,
                "description": event.description,
                "start": event.start.isoformat(),
                "end": event.end.isoformat(),
                "location": event.location,
                "status": event.status,
                "attendees": event.attendees,
                "updated": event.updated.isoformat() if event.updated else None
            },
            "message": "Event updated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("update_event_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to update event")

@router.delete("/events/{event_id}")
async def delete_event(
    request: Request,
    event_id: str,
    calendar_id: str = Query(default="primary", description="Calendar ID to delete event from"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an event"""
    try:
        if current_user.provider != "google":
            raise HTTPException(
                status_code=400,
                detail="Google Calendar integration is only available for Google-authenticated users"
            )
        
        access_token = _get_oauth_access_token(request)
        service = GoogleCalendarService(access_token, str(current_user.timezone or "UTC"))
        success = await service.delete_event(event_id, calendar_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Event not found or deletion failed"
            )
        
        return {"message": "Event deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("delete_event_failed", error=str(e), user_id=current_user.id)
        _raise_calendar_error(e, "Failed to delete event")
