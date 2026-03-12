# pyre-unsafe
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
import structlog

from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_calendar_provider, get_current_user, get_calendar_integration_provider
from app.models.meeting import Meeting
from app.models.user import User
from app.schemas.meeting import Attendee, MeetingCreate, MeetingRead, MeetingUpdate

logger = structlog.get_logger()

router = APIRouter(prefix="/meetings", tags=["meetings"])


async def sync_google_calendar_meetings(current_user: User, calendar_provider, db: AsyncSession):
    """Sync meetings from Google Calendar to local database."""
    try:
        # Extract primitive values upfront to avoid SQLAlchemy ORM expiry issues
        # across async session boundaries
        user_id = current_user.id
        user_provider = str(current_user.provider)

        # Get meetings from Google Calendar for the next 30 days
        end_time = datetime.now(timezone.utc) + timedelta(days=30)
        start_time = datetime.now(timezone.utc) - timedelta(days=7)  # Include past 7 days
        
        # Fetch events from Google Calendar
        events: List[Dict[str, Any]] = await calendar_provider.get_events(start_time, end_time)
        
        # Keep track of active external event IDs from Google Calendar
        active_external_ids = set()
        
        # Sync each event to database (Add/Update)
        for event in events:  # pyre-ignore[29]
            # events are always plain dicts from list_events
            event_id = event.get("id")
            event_summary = event.get("summary", "No Title")
            event_description = event.get("description", "")
            event_start = event.get("start")
            event_end = event.get("end")
            # attendees are now stored as plain dicts by list_events
            raw_attendees = event.get("attendees") or []
            
            # Ensure attendees are pure dicts (defensive)
            attendees_list = []
            for a in raw_attendees:
                if isinstance(a, dict):
                    attendees_list.append(a)
                elif hasattr(a, "model_dump"):
                    attendees_list.append(a.model_dump())
                elif hasattr(a, "email"):
                    attendees_list.append({"email": str(a.email)})

            if not event_id or not event_start or not event_end:
                continue
                
            active_external_ids.add(event_id)

            # Check if meeting already exists
            result = await db.execute(
                select(Meeting).where(
                    and_(
                        Meeting.user_id == user_id,
                        Meeting.external_event_id == event_id
                    )
                )
            )
            existing_meeting = result.scalar_one_or_none()
            
            if existing_meeting:
                # Update existing meeting
                existing_meeting.title = event_summary
                existing_meeting.description = event_description
                existing_meeting.start_time = event_start
                existing_meeting.end_time = event_end
                existing_meeting.attendees = attendees_list
                existing_meeting.status = "scheduled"
                existing_meeting.updated_at = datetime.now(timezone.utc)
            else:
                # Create new meeting
                meeting = Meeting(
                    user_id=user_id,
                    external_event_id=event_id,
                    title=event_summary,
                    description=event_description,
                    start_time=event_start,
                    end_time=event_end,
                    attendees=attendees_list,
                    status="scheduled",
                    provider=user_provider,
                    raw_user_input="Synced from Google Calendar"
                )
                db.add(meeting)
                
        # Handle Deletions: Find all local meetings in this timeframe that are no longer on GC
        local_meetings_result = await db.execute(
            select(Meeting).where(
                and_(
                    Meeting.user_id == user_id,
                    Meeting.status != "canceled",
                    Meeting.external_event_id.isnot(None),
                    Meeting.start_time >= start_time,
                    Meeting.start_time <= end_time
                )
            )
        )
        local_meetings = local_meetings_result.scalars().all()
        
        canceled_count = 0
        for local_meeting in local_meetings:
            if local_meeting.external_event_id not in active_external_ids:
                # The event exists in our DB but was deleted from Google Calendar
                local_meeting.status = "canceled"
                local_meeting.updated_at = datetime.now(timezone.utc)
                canceled_count += 1
        
        await db.commit()
        logger.info("google_calendar_synced", user_id=user_id, events_synced=len(events), events_canceled=canceled_count)
        
    except Exception as e:
        logger.error("google_calendar_sync_failed", error=str(e), user_id=str(current_user.id) if hasattr(current_user, 'id') else "unknown", exc_info=True)
        # Don't raise exception - continue with cached data


@router.get("", response_model=List[MeetingRead])

async def get_meetings(
    current_user: User = Depends(get_current_user),
    calendar_integration = Depends(get_calendar_integration_provider),
    db: AsyncSession = Depends(get_db),
):
    """Get all meetings for the current user with timezone-aware Calendar sync."""
    try:
        # First, sync meetings from Calendar with timezone awareness
        await sync_google_calendar_meetings(current_user, calendar_integration, db)
        
        # Then get meetings from database - strictly filter for recent data (last 7 days)
        retention_limit = datetime.now(timezone.utc) - timedelta(days=7)
        result = await db.execute(
            select(Meeting)
            .where(
                and_(
                    Meeting.user_id == current_user.id, 
                    Meeting.status != "canceled",
                    Meeting.start_time >= retention_limit
                )
            )
            .order_by(Meeting.start_time)
        )
        return list(result.scalars().all())
    except Exception:
        # If sync fails, still return cached meetings from database with strict filtering
        retention_limit = datetime.now(timezone.utc) - timedelta(days=7)
        result = await db.execute(
            select(Meeting)
            .where(
                and_(
                    Meeting.user_id == current_user.id, 
                    Meeting.status != "canceled",
                    Meeting.start_time >= retention_limit
                )
            )
            .order_by(Meeting.start_time)
        )
        return list(result.scalars().all())


@router.get("/{meeting_id}", response_model=MeetingRead)
async def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific meeting by ID."""
    try:
        meeting_uuid = uuid.UUID(meeting_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid meeting id")
    result = await db.execute(
        select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == current_user.id))
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    return meeting


@router.put("/{meeting_id}", response_model=MeetingRead)
async def update_meeting(
    meeting_id: str,
    meeting_update: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    calendar_provider = Depends(get_calendar_provider),
    db: AsyncSession = Depends(get_db),
):
    """Update a meeting."""
    try:
        meeting_uuid = uuid.UUID(meeting_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid meeting id")
    result = await db.execute(
        select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == current_user.id))
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    try:
        # Update meeting data
        update_data = meeting_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "attendees" and value is not None:
                value = [a.model_dump() for a in value]
            setattr(meeting, field, value)
        
        meeting.updated_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        
        # Update in calendar if external event exists
        if meeting.external_event_id:
            meeting_create = MeetingCreate(
                title=str(meeting.title),
                description=str(meeting.description) if meeting.description else None,
                start_time=getattr(meeting, 'start_time'),
                end_time=getattr(meeting, 'end_time'),
                attendees=[Attendee(**a) for a in (getattr(meeting, 'attendees') or [])],
                provider=str(meeting.provider),
                raw_user_input=str(meeting.raw_user_input) if meeting.raw_user_input else None,
                reminder_schedule_minutes=getattr(meeting, 'reminder_schedule_minutes', None),
                reminder_methods=getattr(meeting, 'reminder_methods', None),
            )
            await calendar_provider.update_event(meeting.external_event_id, meeting_create)
        
        await db.commit()
        await db.refresh(meeting)
        
        return meeting
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update meeting: {str(e)}"
        )


@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    calendar_provider = Depends(get_calendar_provider),
    db: AsyncSession = Depends(get_db),
):
    """Cancel/delete a meeting."""
    try:
        meeting_uuid = uuid.UUID(meeting_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid meeting id")
    result = await db.execute(
        select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == current_user.id))
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    try:
        # Delete from calendar
        if meeting.external_event_id:
            await calendar_provider.delete_event(meeting.external_event_id)
            # Remove any scheduled reminders for this meeting
            try:
                from app.services.scheduler import remove_job
                # Prefer removing jobs that match the meeting's configured reminder minutes
                minutes_list = getattr(meeting, 'reminder_schedule_minutes', None)
                if minutes_list:
                    for minutes in minutes_list:
                        try:
                            remove_job(f"reminder-{meeting.id}-{minutes}")
                        except Exception:
                            pass
                else:
                    # Fallback to common candidates
                    for minutes in (3, 15, 60, 1440):
                        try:
                            remove_job(f"reminder-{meeting.id}-{minutes}")
                        except Exception:
                            pass
                    try:
                        remove_job(f"reminder-{meeting.id}")
                    except Exception:
                        pass
            except Exception:
                pass
        
        # Update status in database
        meeting.status = "canceled"  # type: ignore[assignment]
        meeting.updated_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        await db.commit()
        
        return {"message": "Meeting canceled successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to cancel meeting: {str(e)}"
        )
