from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo

import structlog
import uuid
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
from app.services.scheduler_service import find_available_slot, get_next_business_day

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
        
        # Handle clarification needed
        if parsed_intent.clarification_needed:
            context.append({"role": "assistant", "content": parsed_intent.clarification_needed})
            await save_conversation_context(str(current_user.id), context)
            
            return ChatResponse(
                response=parsed_intent.clarification_needed,
                intent=parsed_intent.intent,
                requires_clarification=True
            )
        
        # Process based on intent with automatic scheduling
        if parsed_intent.intent == "CREATE_MEETING":
            response = await handle_create_meeting(
                parsed_intent, current_user, calendar_provider, db, raw_user_input=payload.message
            )
        elif parsed_intent.intent == "CANCEL_MEETING":
            response = await handle_cancel_meeting(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "UPDATE_MEETING":
            response = await handle_update_meeting(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "QUERY_AVAILABILITY":
            response = await handle_query_availability(
                parsed_intent, current_user, calendar_provider
            )
        else:
            # Enhanced AI response for unknown intents
            ai_response = await llm_service.generate_helpful_response(
                payload.message, current_user.full_name or "there"
            )
            response = ChatResponse(
                response=ai_response,
                intent="GENERAL_CHAT"
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
        if intent.target_date is None:
            return ChatResponse(
                response="What date should I schedule this meeting?",
                intent="CREATE_MEETING",
                requires_clarification=True,
            )

        target_date = intent.target_date
        
        # Build attendee list (never invent emails)
        attendees_emails = list({str(user.email), *[str(a) for a in intent.attendees]})
        
        # Fetch busy slots in the day window (08:00-20:00 local)
        start_local, end_local = _day_window_local(str(intent.target_date), str(user.timezone))
        start_utc = start_local.astimezone(timezone.utc)
        end_utc = end_local.astimezone(timezone.utc)
        
        busy_slots = await calendar_provider.get_free_busy(
            start_utc, end_utc, attendees_emails
        )

        duration_minutes = int(intent.duration_minutes or 30)

        requested_slot = None
        if intent.target_time is not None:
            local_start = _combine_local_datetime(target_date, intent.target_time, str(user.timezone))
            start = local_start.astimezone(timezone.utc)
            requested_slot = (start, start + timedelta(minutes=duration_minutes))

        available_slot = None
        if requested_slot is not None:
            # If requested slot overlaps any busy slot, fallback to search.
            rs, re = requested_slot
            conflict = any(not (re <= b.start or rs >= b.end) for b in busy_slots)
            if not conflict:
                from app.services.calendar_provider import TimeSlot

                available_slot = TimeSlot(start=rs, end=re)

        if available_slot is None:
            available_slot = find_available_slot(
                busy_slots=busy_slots,
                duration_minutes=duration_minutes,
                target_date=target_date,
                time_preference=intent.time_preference,
                user_timezone=str(user.timezone),
            )

        if available_slot is None:
            next_day = get_next_business_day(target_date)
            return ChatResponse(
                response=f"No available slots found on {target_date.isoformat()}. Would you like to try {next_day.isoformat()}?",
                intent="CREATE_MEETING",
                requires_clarification=True,
            )

        title = intent.title or "Meeting"

        # Idempotency (prevent duplicates)
        existing = await db.execute(
            select(Meeting).where(
                and_(
                    Meeting.user_id == user.id,
                    Meeting.title == title,
                    Meeting.start_time == available_slot.start,
                )
            )
        )
        existing_meeting = existing.scalar_one_or_none()
        if existing_meeting is not None:
            return ChatResponse(
                response="That meeting already exists. I won't create a duplicate.",
                intent="CREATE_MEETING",
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
            description="Meeting created via AI scheduler",
            start_time=available_slot.start,
            end_time=available_slot.end,
            attendees=[Attendee(email=e) for e in attendees_emails],
            provider=str(user.provider),
            raw_user_input=None,
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
            response=f"Meeting scheduled: {title} on {formatted_time}.",
            intent="CREATE_MEETING",
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
            response="I couldn't schedule that right now due to a calendar or network error. Please try again.",
            intent="CREATE_MEETING"
        )


async def handle_cancel_meeting(intent, user: User, calendar_provider, db: AsyncSession):
    """Handle meeting cancellation intent."""
    try:
        meeting: Optional[Meeting] = None
        if intent.meeting_id_to_modify:
            try:
                meeting_uuid = uuid.UUID(intent.meeting_id_to_modify)
                result = await db.execute(
                    select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == user.id))
                )
                meeting = result.scalar_one_or_none()
            except Exception:
                meeting = None
        if meeting is None:
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
                intent="CANCEL_MEETING"
            )
        
        # Delete from calendar
        if meeting.external_event_id:
            await calendar_provider.delete_event(meeting.external_event_id)
        
        # Update database
        meeting.status = "canceled"  # type: ignore[assignment]
        await db.commit()
        
        return ChatResponse(
            response=f"Meeting '{meeting.title}' has been canceled.",
            intent="CANCEL_MEETING"
        )
        
    except Exception as e:
        logger.error("chat_cancel_meeting_failed", error=str(e))
        return ChatResponse(
            response="I couldn't cancel that meeting right now due to a calendar or network error. Please try again.",
            intent="CANCEL_MEETING"
        )


async def handle_update_meeting(intent, user: User, calendar_provider, db: AsyncSession):
    """Handle meeting update intent."""
    # Similar to cancel + create
    return ChatResponse(
        response="Meeting updates are not yet implemented.",
        intent="UPDATE_MEETING"
    )


async def handle_query_availability(intent, user: User, calendar_provider):
    """Handle availability query intent."""
    try:
        target_date = intent.target_date or datetime.now().date()
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = start_of_day + timedelta(days=1)
        
        busy_slots = await calendar_provider.get_free_busy(
            start_of_day, end_of_day, [user.email]
        )
        
        if not busy_slots:
            return ChatResponse(
                response=f"You're free all day on {target_date}.",
                intent="QUERY_AVAILABILITY"
            )
        
        # Format busy times
        busy_times = []
        for slot in busy_slots:
            local_start = slot.start.astimezone(ZoneInfo(str(user.timezone)))
            busy_times.append(local_start.strftime("%I:%M %p"))
        
        return ChatResponse(
            response=f"On {target_date}, you're busy at: {', '.join(busy_times)}",
            intent="QUERY_AVAILABILITY"
        )
        
    except Exception as e:
        return ChatResponse(
            response=f"Failed to check availability: {str(e)}",
            intent="QUERY_AVAILABILITY"
        )
