from __future__ import annotations

from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo

import structlog
import time as _time

from fastapi import APIRouter, Depends, Request
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.core.security import hash_user_id
from app.db.session import get_db
from app.dependencies import (
    get_calendar_provider,
    get_conversation_context,
    get_current_user,
    save_conversation_context,
)
from app.models.meeting import Meeting
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse
from app.schemas.meeting import Attendee, MeetingCreate
from app.services.llm_service import llm_service

router = APIRouter(prefix="/chat", tags=["chat"])
logger = structlog.get_logger()


@router.post("/message", response_model=ChatResponse)
@limiter.limit("20/minute")
async def send_message(
    request: Request,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    calendar_provider = Depends(get_calendar_provider),
    db: AsyncSession = Depends(get_db),
):
    """AI-powered chat for meeting scheduling with Gemini."""
    start = _time.perf_counter()
    
    try:
        # Get conversation context
        context = await get_conversation_context(str(current_user.id))
        
        # Parse user intent with enhanced AI
        parsed_intent = await llm_service.parse_intent(
            str(payload.message),
            str(current_user.timezone),
            context,
        )
        
        # Add user message to context
        context.append({"role": "user", "content": payload.message})
        
        # Handle different intents
        if parsed_intent.intent == "schedule":
            response = await handle_create_meeting(
                parsed_intent, current_user, calendar_provider, db, raw_user_input=payload.message
            )
        elif parsed_intent.intent == "cancel":
            response = await handle_cancel_meeting(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "reschedule":
            response = await handle_update_meeting(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "check_availability":
            response = await handle_query_availability(
                parsed_intent, current_user, calendar_provider
            )
        else:
            # Use the response from the AI directly
            response = ChatResponse(
                response=parsed_intent.response,
                intent=parsed_intent.intent
            )
        
        # Add bot response to context
        context.append({"role": "assistant", "content": response.response})
        await save_conversation_context(str(current_user.id), context)

        logger.info(
            "ai_chat_processed",
            user_id_hash=hash_user_id(str(current_user.id)),
            intent=parsed_intent.intent,
            outcome="clarification" if response.requires_clarification else "completed",
            duration_ms=round((_time.perf_counter() - start) * 1000, 2),
        )
        
        return response
        
    except Exception as e:
        logger.error("ai_chat_failed", error=str(e), user_id_hash=hash_user_id(str(current_user.id)))
        return ChatResponse(
            response="I'm experiencing some technical difficulties. Please try again in a moment.",
            intent="ERROR"
        )


def _combine_local_datetime(target_date, target_time, user_tz: str) -> datetime:
    try:
        tz = ZoneInfo(user_tz) if user_tz else ZoneInfo("UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    return datetime.combine(target_date, target_time).replace(tzinfo=tz)


def _day_window_local(target_date, user_tz: str) -> tuple[datetime, datetime]:
    try:
        tz = ZoneInfo(user_tz) if user_tz else ZoneInfo("UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    start_local = datetime.combine(target_date, time(8, 0)).replace(tzinfo=tz)
    end_local = datetime.combine(target_date, time(20, 0)).replace(tzinfo=tz)
    return start_local, end_local


async def handle_create_meeting(intent, user: User, calendar_provider, db: AsyncSession, raw_user_input: str):
    """Handle meeting creation intent."""
    try:
        # Check if we have enough information
        if not intent.start_time:
            return ChatResponse(
                response="I need more details about when to schedule this meeting. Could you specify a date and time?",
                intent="schedule",
                requires_clarification=True,
            )

        # Parse datetime from ISO string
        try:
            start_time = datetime.fromisoformat(intent.start_time.replace('Z', '+00:00'))
            if intent.end_time:
                end_time = datetime.fromisoformat(intent.end_time.replace('Z', '+00:00'))
            else:
                end_time = start_time + timedelta(minutes=30)  # Default 30 minutes
        except Exception:
            return ChatResponse(
                response="I couldn't understand the time format. Please try again with a clearer date and time.",
                intent="schedule",
                requires_clarification=True,
            )
        
        # Build attendee list
        attendees_emails = list({str(user.email), *intent.attendees})
        
        # Check for conflicts
        busy_slots = await calendar_provider.get_free_busy(
            start_time, end_time, attendees_emails
        )

        # Check if requested slot conflicts
        conflict = any(not (end_time <= b.start or start_time >= b.end) for b in busy_slots)
        if conflict:
            return ChatResponse(
                response="There's a scheduling conflict at that time. Would you like me to suggest an alternative time?",
                intent="schedule",
                requires_clarification=True,
            )

        title = intent.title or "Meeting"

        # Check for duplicates
        existing = await db.execute(
            select(Meeting).where(
                and_(
                    Meeting.user_id == user.id,
                    Meeting.title == title,
                    Meeting.start_time == start_time,
                )
            )
        )
        existing_meeting = existing.scalar_one_or_none()
        if existing_meeting is not None:
            return ChatResponse(
                response="That meeting already exists. I won't create a duplicate.",
                intent="schedule",
                meeting={
                    "id": str(existing_meeting.id),
                    "title": existing_meeting.title,
                    "start_time": existing_meeting.start_time.isoformat(),
                    "end_time": existing_meeting.end_time.isoformat(),
                    "attendees": existing_meeting.attendees,
                    "status": existing_meeting.status,
                },
            )

        meeting_create = MeetingCreate(
            title=title,
            description=intent.description or "Meeting created via AI scheduler",
            start_time=start_time,
            end_time=end_time,
            attendees=[Attendee(email=e) for e in attendees_emails],
            provider=str(user.provider),
            raw_user_input=raw_user_input,
        )

        external_event_id = await calendar_provider.create_event(meeting_create)

        meeting = Meeting(
            user_id=user.id,
            external_event_id=external_event_id,
            title=meeting_create.title,
            description=meeting_create.description,
            start_time=meeting_create.start_time,
            end_time=meeting_create.end_time,
            attendees=[a.model_dump() for a in meeting_create.attendees],
            status="scheduled",
            provider=user.provider,
            raw_user_input=raw_user_input,
        )

        db.add(meeting)
        await db.commit()
        await db.refresh(meeting)

        try:
            local_start = meeting_create.start_time.astimezone(ZoneInfo(str(user.timezone)))
        except Exception:
            local_start = meeting_create.start_time
        formatted_time = local_start.strftime("%A, %B %d at %I:%M %p")

        logger.info(
            "chat_meeting_created",
            user_id_hash=hash_user_id(str(user.id)),
            provider=user.provider,
            start_time_utc=meeting_create.start_time.isoformat(),
        )

        return ChatResponse(
            response=f"✅ Meeting scheduled: {title} on {formatted_time}",
            intent="schedule",
            meeting={
                "id": str(meeting.id),
                "title": meeting.title,
                "start_time": meeting.start_time.isoformat(),
                "end_time": meeting.end_time.isoformat(),
                "attendees": meeting.attendees,
                "status": meeting.status
            }
        )
        
    except Exception as e:
        logger.error("chat_create_meeting_failed", error=str(e))
        return ChatResponse(
            response="I couldn't schedule that meeting right now. Please try again or check your calendar connection.",
            intent="schedule"
        )


async def handle_cancel_meeting(intent, user: User, calendar_provider, db: AsyncSession):
    """Handle meeting cancellation intent."""
    try:
        # Find the most recent scheduled meeting
        result = await db.execute(
            select(Meeting)
            .where(and_(Meeting.user_id == user.id, Meeting.status == "scheduled"))
            .order_by(Meeting.start_time.asc())
            .limit(1)
        )
        meeting = result.scalar_one_or_none()
        
        if not meeting:
            return ChatResponse(
                response="No scheduled meetings found to cancel.",
                intent="cancel"
            )
        
        # Delete from calendar
        if meeting.external_event_id:
            await calendar_provider.delete_event(meeting.external_event_id)
        
        # Update database
        meeting.status = "canceled"  # type: ignore[assignment]
        await db.commit()
        
        return ChatResponse(
            response=f"❌ Meeting '{meeting.title}' has been canceled.",
            intent="cancel"
        )
        
    except Exception as e:
        logger.error("chat_cancel_meeting_failed", error=str(e))
        return ChatResponse(
            response="I couldn't cancel that meeting right now. Please try again.",
            intent="cancel"
        )


async def handle_update_meeting(intent, user: User, calendar_provider, db: AsyncSession):
    """Handle meeting update intent."""
    return ChatResponse(
        response="Meeting updates are not yet implemented. You can cancel and reschedule instead.",
        intent="reschedule"
    )


async def handle_query_availability(intent, user: User, calendar_provider):
    """Handle availability query intent."""
    try:
        # Default to today if no specific time provided
        target_date = datetime.now().date()
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = start_of_day + timedelta(days=1)
        
        busy_slots = await calendar_provider.get_free_busy(
            start_of_day, end_of_day, [user.email]
        )
        
        if not busy_slots:
            return ChatResponse(
                response=f"📅 You're completely free today ({target_date})!",
                intent="check_availability"
            )
        
        # Format busy times
        busy_times = []
        for slot in busy_slots:
            try:
                local_start = slot.start.astimezone(ZoneInfo(str(user.timezone)))
                local_end = slot.end.astimezone(ZoneInfo(str(user.timezone)))
                busy_times.append(f"{local_start.strftime('%I:%M %p')} - {local_end.strftime('%I:%M %p')}")
            except Exception:
                busy_times.append(f"{slot.start.strftime('%I:%M %p')} - {slot.end.strftime('%I:%M %p')}")
        
        return ChatResponse(
            response=f"📅 On {target_date}, you're busy during: {', '.join(busy_times)}",
            intent="check_availability"
        )
        
    except Exception as e:
        logger.error("chat_availability_failed", error=str(e))
        return ChatResponse(
            response="I couldn't check your availability right now. Please try again.",
            intent="check_availability"
        )
