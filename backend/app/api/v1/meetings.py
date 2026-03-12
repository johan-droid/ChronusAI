# pyre-unsafe
from __future__ import annotations

import asyncio as _asyncio
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
from app.services.email import send_email

logger = structlog.get_logger()

router = APIRouter(prefix="/meetings", tags=["meetings"])


def _reschedule_reminder_jobs(meeting: Meeting, current_user: User) -> None:
    """Remove old APScheduler reminder jobs and schedule new ones based on current meeting state."""
    from app.services.scheduler import remove_job, schedule_job
    from app.services.email import send_email

    # Remove any existing reminder jobs for this meeting
    old_minutes = getattr(meeting, 'reminder_schedule_minutes', None) or []
    # Also try common candidates in case the list changed
    all_candidates = sorted({*old_minutes, 3, 5, 10, 15, 30, 60, 1440})
    for mins in all_candidates:
        try:
            remove_job(f"reminder-{meeting.id}-{mins}")
        except Exception:
            pass

    # Schedule new jobs
    schedule_minutes = list(meeting.reminder_schedule_minutes or [])
    if not schedule_minutes:
        return

    attendees = [
        a.get("email") if isinstance(a, dict) else str(a)
        for a in (meeting.attendees or [])
    ]
    subject_base = f"Reminder: {meeting.title}"
    text_body = (
        f"Your meeting '{meeting.title}' is coming up.\n\n"
        f"Details:\n{meeting.description or ''}\n\nLink: {meeting.meeting_url or 'N/A'}\n\n"
        "This is an automated reminder from ChronosAI."
    )
    html_body = (
        f"<p>Your meeting '<strong>{meeting.title}</strong>' is coming up.</p>"
        f"<p>{meeting.description or ''}</p>"
        f"<p>Join: <a href=\"{meeting.meeting_url or '#'}\">{meeting.meeting_url or 'Open meeting'}</a></p>"
        f"<hr/><p><small>Automated reminder from ChronosAI.</small></p>"
    )

    now = datetime.now(timezone.utc)
    for minutes_before in sorted(set(int(x) for x in schedule_minutes if int(x) >= 0)):
        run_at = meeting.start_time - timedelta(minutes=minutes_before)
        if run_at <= now:
            continue
        try:
            schedule_job(
                send_email,
                run_date=run_at,
                args=[attendees, f"{subject_base} (in {minutes_before} min)", text_body, html_body],
                id=f"reminder-{meeting.id}-{minutes_before}",
            )
        except Exception:
            logger.exception("failed_to_reschedule_reminder", meeting_id=str(meeting.id), minutes_before=minutes_before)


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
        events: List[Dict[str, Any]] = await calendar_provider.get_events(start_time=start_time, end_time=end_time)
        
        # Keep track of active external event IDs from Google Calendar
        active_external_ids = set()
        
        # Sync each event to database (Add/Update)
        for event in events:  # pyre-ignore[29]
            # events are always plain dicts from list_events
            event_id = event.get("id")
            event_summary = event.get("summary", "No Title")
            # If the summary is just an email address, replace with something friendlier
            if event_summary and "@" in event_summary and " " not in event_summary.strip():
                event_summary = "Meeting"
            event_description = event.get("description", "")
            event_start_raw = event.get("start")
            event_end_raw = event.get("end")

            # Ensure start/end are datetime objects (CalendarIntegrationService returns ISO strings)
            def _to_dt(val):
                if val is None:
                    return None
                if isinstance(val, datetime):
                    return val
                if isinstance(val, str):
                    return datetime.fromisoformat(val.replace("Z", "+00:00"))
                return None

            event_start = _to_dt(event_start_raw)
            event_end = _to_dt(event_end_raw)
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

        # Reschedule APScheduler reminder jobs when time or reminders change
        _reschedule_reminder_jobs(meeting, current_user)

        # Send immediate confirmation email if reminders were changed
        reminders_changed = "reminder_schedule_minutes" in update_data or "reminder_methods" in update_data
        new_mins = list(meeting.reminder_schedule_minutes or [])
        if reminders_changed and new_mins and current_user.email:
            friendly = ", ".join(
                "1 day" if m == 1440 else f"{m // 60}h" if m >= 60 else f"{m}m"
                for m in sorted(new_mins)
            )
            methods = ", ".join(meeting.reminder_methods or ["email"])
            confirm_subject = f"✅ Reminders updated – {meeting.title}"
            confirm_text = (
                f"Hi {current_user.full_name or 'there'},\n\n"
                f"Your reminders for \"{meeting.title}\" have been updated.\n\n"
                f"Reminders: {friendly} before the meeting\n"
                f"Methods: {methods}\n"
                f"Meeting time: {meeting.start_time:%Y-%m-%d %H:%M} UTC\n\n"
                "You'll receive notifications at the scheduled times.\n\n"
                "– ChronosAI"
            )
            confirm_html = (
                f"<p>Hi {current_user.full_name or 'there'},</p>"
                f"<p>Your reminders for <strong>{meeting.title}</strong> have been updated.</p>"
                f"<table style='border-collapse:collapse;margin:12px 0'>"
                f"<tr><td style='padding:4px 12px 4px 0;color:#888'>Reminders</td><td><strong>{friendly}</strong> before</td></tr>"
                f"<tr><td style='padding:4px 12px 4px 0;color:#888'>Methods</td><td>{methods}</td></tr>"
                f"<tr><td style='padding:4px 12px 4px 0;color:#888'>Meeting</td><td>{meeting.start_time:%Y-%m-%d %H:%M} UTC</td></tr>"
                f"</table>"
                f"<p>You'll receive notifications at the scheduled times.</p>"
                f"<hr/><p><small>ChronosAI – Automated Calendar Assistant</small></p>"
            )
            _asyncio.create_task(
                send_email([str(current_user.email)], confirm_subject, confirm_text, confirm_html)
            )
            logger.info("reminder_confirmation_email_queued", meeting_id=str(meeting.id), user=str(current_user.email))

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
