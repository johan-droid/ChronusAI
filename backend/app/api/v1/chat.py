# pyre-unsafe
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

import structlog
import time as _time

from fastapi import APIRouter, Depends, Request
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.core.security import hash_user_id, token_encryptor
from app.db.session import get_db
from app.dependencies import (
    get_calendar_provider,
    get_conversation_context,
    get_current_user,
    save_conversation_context,
)
from app.models.oauth_credential import OAuthCredential
from app.models.meeting import Meeting
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, ParsedIntent
from app.schemas.meeting import Attendee, MeetingCreate
from app.services.llm_service import llm_service
from app.services.ai_scheduling_service import ai_scheduling_service

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
        logger.info(
            "ai_chat_start",
            user_id_hash=hash_user_id(str(current_user.id)),
            message_length=len(payload.message),
            user_email=current_user.email
        )
        
        # Get conversation context
        context = await get_conversation_context(str(current_user.id))
        
        # 1. Fetch live events from Google Calendar (Source of Truth)
        now_utc = datetime.now(timezone.utc)
        end_time = now_utc + timedelta(days=7)  # Next 7 days
        
        live_events = await fetch_live_calendar_events(calendar_provider, current_user, now_utc, end_time)
        
        # Format live events for prompt injection
        events_context = "No upcoming events in Google Calendar."
        if live_events:
            context_lines: list[str] = []
            for event in live_events[:5]:  # Limit to 5 for context
                context_lines.append(
                    f'- ID: {event["id"]}, Title: "{event["title"]}", '
                    f'Start: {event["start_time"].isoformat()}, '
                    f'Attendees: {event["attendees"]}'
                )
            events_context = "\n".join(context_lines)
        
        # 2. Implement Self-Correction Retry Loop
        max_retries = 2
        parsed_intent = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                # Add error feedback to context if this is a redo
                if last_error:
                    context.append({
                        "role": "system", 
                        "content": f"Safety Warning: Your last tool call failed with error: {last_error}. Please correct the formatting (especially datetimes) and try again."
                    })

                # Parse intent with enhanced context
                parsed_intent = await llm_service.parse_intent(
                    str(payload.message),
                    str(current_user.timezone),
                    str(current_user.email),
                    str(current_user.full_name or "User"),
                    context,
                    upcoming_events_context=events_context
                )
                
                # Basic validation: ensure dates are parsable if provided
                if parsed_intent.start_time:
                    datetime.fromisoformat(parsed_intent.start_time.replace('Z', '+00:00'))
                
                # If we got here, parsing is successful
                break
            except Exception as e:
                last_error = str(e)
                if attempt == max_retries - 1:
                    logger.error("ai_intent_parsing_exhausted", error=last_error)
                    return ChatResponse(
                        response="I'm having trouble understanding the specific date or details. Could you please rephrase your request?",
                        intent="ERROR"
                    )

        if parsed_intent is None:
             return ChatResponse(response="I couldn't process that request.", intent="ERROR")

        # Assertion for Pyre to track non-nullness
        assert parsed_intent is not None

        logger.info(
            "ai_intent_parsed",
            user_id_hash=hash_user_id(str(current_user.id)),
            intent=parsed_intent.intent,
            has_title=bool(parsed_intent.title),
            has_time=bool(parsed_intent.start_time)
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
        elif parsed_intent.intent == "find_time":
            response = await handle_find_optimal_time(
                parsed_intent, current_user, calendar_provider
            )
        elif parsed_intent.intent == "suggest_times":
            response = await handle_ai_suggestions(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "list_meetings":
            response = await handle_list_meetings(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "chat":
            # Handle general conversation using the LLM's response
            if parsed_intent.response and parsed_intent.response.strip():
                response = ChatResponse(
                    response=parsed_intent.response,
                    intent=parsed_intent.intent,
                    requires_clarification=parsed_intent.requires_clarification
                )
            else:
                # Generate helpful response with user context
                helpful_response = await llm_service.generate_helpful_response(
                    payload.message,
                    str(current_user.full_name or "User"),
                    str(current_user.email)
                )
                response = ChatResponse(
                    response=helpful_response,
                    intent="chat"
                )
        else:
            # Use the response from the AI directly or generate helpful response
            if parsed_intent.response and parsed_intent.response.strip():
                response = ChatResponse(
                    response=parsed_intent.response,
                    intent=parsed_intent.intent
                )
            else:
                # Generate helpful response with user context
                helpful_response = await llm_service.generate_helpful_response(
                    payload.message,
                    str(current_user.full_name or "User"),
                    str(current_user.email)
                )
                response = ChatResponse(
                    response=helpful_response,
                    intent="chat"
                )
        
        # Add bot response to context
        context.append({"role": "assistant", "content": response.response})
        await save_conversation_context(str(current_user.id), context)

        logger.info(
            "ai_chat_processed",
            user_id_hash=hash_user_id(str(current_user.id)),
            intent=parsed_intent.intent,
            outcome="clarification" if response.requires_clarification else "completed",
            duration_ms=int((_time.perf_counter() - start) * 1000),
        )
        
        return response
        
    except Exception as e:
        logger.error(
            "ai_chat_failed", 
            error=str(e),
            error_type=type(e).__name__,
            user_id_hash=hash_user_id(str(current_user.id)),
            exc_info=True
        )
        
        # Enhanced error diagnostics using test_connection
        try:
            connection_status = await calendar_provider.test_connection()
            if not connection_status.get("success", False):
                error_detail = connection_status.get("error", "Unknown calendar connection issue")
                return ChatResponse(
                    response=f"🔗 Calendar connection issue: {error_detail}. Please check your Google Calendar integration.",
                    intent="ERROR"
                )
        except Exception as conn_e:
            logger.warning("calendar_connection_test_failed", error=str(conn_e))
        
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


async def handle_create_meeting(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession, raw_user_input: str) -> ChatResponse:
    """Handle meeting creation intent."""
    try:
        # Check if we have enough information
        if not intent.start_time:
            return ChatResponse(
                response="I need more details about when to schedule this meeting. Could you specify a date and time?",
                intent="schedule",
                requires_clarification=True,
            )

        # Parse datetime from local time string (LLM now outputs local time)
        try:
            # Convert local time to UTC
            local_start = datetime.fromisoformat(intent.start_time)
            if local_start.tzinfo is None:
                # Assume user timezone if not specified
                tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
                local_start = local_start.replace(tzinfo=tz)
            start_time = local_start.astimezone(timezone.utc)
                
            if intent.end_time:
                local_end = datetime.fromisoformat(intent.end_time)
                if local_end.tzinfo is None:
                    tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
                    local_end = local_end.replace(tzinfo=tz)
                end_time = local_end.astimezone(timezone.utc)
            else:
                end_time = start_time + timedelta(minutes=30)  # Default 30 minutes
        except Exception:
            return ChatResponse(
                response="I couldn't understand the time format. Please try again with a clearer date and time.",
                intent="schedule",
                requires_clarification=True,
            )
        
        # Build attendee list with email validation
        attendees_emails = list({str(user.email), *(intent.attendees or [])})
        
        # Validate all attendee emails
        invalid_emails = []
        for email in attendees_emails:
            if not '@' in email or '.' not in email.split('@')[-1]:
                invalid_emails.append(email)
        
        if invalid_emails:
            return ChatResponse(
                response=f"I need valid email addresses for all attendees. These don't look like emails: {', '.join(invalid_emails)}. Could you provide the correct email addresses?",
                intent="schedule",
                requires_clarification=True,
            )
        
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

        platform = getattr(intent, "meeting_platform", None) or "none"
        add_video = None
        if platform == "meet" and str(user.provider) == "google":
            add_video = "google_meet"
        elif platform == "teams" and str(user.provider) == "outlook":
            add_video = "teams"

        create_result = await calendar_provider.create_event(
            meeting_create,
            add_video_conference=add_video,
        )
        external_event_id = create_result.event_id
        meeting_url = create_result.meeting_url

        zoom_meeting_id = None
        if platform == "zoom":
            res = await db.execute(
                select(OAuthCredential).where(
                    and_(
                        OAuthCredential.user_id == user.id,
                        OAuthCredential.provider == "zoom",
                    )
                )
            )
            zoom_cred = res.scalar_one_or_none()
            if zoom_cred:
                from app.core.zoom import ZoomClient
                zoom_client = ZoomClient(token_encryptor.decrypt(zoom_cred.access_token))
                duration_min = max(15, min(720, int((end_time - start_time).total_seconds() / 60)))
                zoom_meeting = await zoom_client.create_meeting(
                    topic=title,
                    start_time=start_time,
                    duration_minutes=duration_min,
                    description=meeting_create.description,
                )
                meeting_url = zoom_meeting.get("join_url")
                zoom_meeting_id = str(zoom_meeting.get("id", ""))
                meeting_create.description = f"{meeting_create.description or ''}\n\nZoom: {meeting_url}"
                await calendar_provider.update_event(external_event_id, meeting_create)

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
            meeting_url=meeting_url,
            zoom_meeting_id=zoom_meeting_id or None,
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
                "status": meeting.status,
                "meeting_url": meeting.meeting_url
            }
        )
        
    except Exception as e:
        logger.error("chat_create_meeting_failed", error=str(e))
        return ChatResponse(
            response="I couldn't schedule that meeting right now. Please try again or check your calendar connection.",
            intent="schedule"
        )


async def handle_cancel_meeting(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession) -> ChatResponse:
    """Handle meeting cancellation intent using enhanced Google Calendar service."""
    try:
        # 1. Fetch live events using the enhanced service's get_events method
        # This returns a List[CalendarEvent]
        now_utc = datetime.now(timezone.utc)
        end_time = now_utc + timedelta(days=7)
        
        events = await calendar_provider.get_events(
            calendar_id="primary", 
            start_time=now_utc, 
            end_time=end_time
        )
        
        if not events:
            return ChatResponse(
                response="I couldn't find any upcoming events in your calendar for the next 7 days.",
                intent="cancel",
            )
        
        # 2. Identify the target event from the List[CalendarEvent]
        target_event = None
        
        # Priority 1: Match by ID if provided in intent
        if hasattr(intent, 'event_id') and intent.event_id:
            target_event = next((e for e in events if e.id == intent.event_id), None)
        
        # Priority 2: Match by exact title
        if not target_event and intent.title:
            target_event = next((e for e in events if e.summary.lower() == intent.title.lower()), None)
            
        # Priority 3: Fuzzy match title
        if not target_event and intent.title:
            target_event = next((e for e in events if intent.title.lower() in e.summary.lower()), None)
        
        if not target_event:
            return ChatResponse(
                response="I couldn't find that specific event. Would you like me to list your upcoming meetings so you can pick one?",
                intent="cancel",
            )
        
        # 3. Use the enhanced delete_event method
        success = await calendar_provider.delete_event(target_event.id)
        
        if success:
            # Sync local database state
            meeting_result = await db.execute(
                select(Meeting).where(
                    and_(
                        Meeting.user_id == user.id,
                        Meeting.external_event_id == target_event.id
                    )
                )
            )
            meeting = meeting_result.scalar_one_or_none()
            if meeting:
                meeting.status = "canceled"
                await db.commit()
            
            return ChatResponse(
                response=f"❌ I've successfully canceled '{target_event.summary}'.",
                intent="cancel"
            )
        else:
            return ChatResponse(
                response="I encountered an issue while trying to delete the event from Google Calendar.",
                intent="cancel"
            )
        
    except Exception as e:
        logger.error("chat_cancel_meeting_failed", error=str(e))
        return ChatResponse(
            response="I'm sorry, I couldn't cancel that meeting right now due to a technical error.",
            intent="cancel"
        )


async def handle_update_meeting(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession) -> ChatResponse:
    """Handle meeting update/reschedule intent using enhanced Google Calendar service."""
    try:
        # 1. Parse and validate the new requested time
        if not intent.start_time:
            return ChatResponse(
                response="When would you like to move the meeting to? Please specify a new date and time.",
                intent="reschedule",
                requires_clarification=True,
            )
        
        try:
            # Convert local time to UTC using user preference
            tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
            local_start = datetime.fromisoformat(intent.start_time)
            if local_start.tzinfo is None:
                local_start = local_start.replace(tzinfo=tz)
            new_start_time = local_start.astimezone(timezone.utc)
                
            if intent.end_time:
                local_end = datetime.fromisoformat(intent.end_time)
                if local_end.tzinfo is None:
                    local_end = local_end.replace(tzinfo=tz)
                new_end_time = local_end.astimezone(timezone.utc)
            else:
                new_end_time = new_start_time + timedelta(minutes=30)
        except Exception:
            return ChatResponse(
                response="I didn't quite catch that time. Could you try saying it again like 'Tomorrow at 2 PM'?",
                intent="reschedule",
                requires_clarification=True,
            )
        
        # 2. Fetch target event using enhanced get_events
        now_utc = datetime.now(timezone.utc)
        events = await calendar_provider.get_events(calendar_id="primary", start_time=now_utc)
        
        target_event = None
        if hasattr(intent, 'event_id') and intent.event_id:
            target_event = next((e for e in events if e.id == intent.event_id), None)
        if not target_event and intent.title:
            target_event = next((e for e in events if intent.title.lower() in e.summary.lower()), None)
            
        if not target_event:
            return ChatResponse(
                response="I couldn't find an event with that name to reschedule.",
                intent="reschedule"
            )

        # 3. Check for conflicts using enhanced get_free_busy
        # Collect emails: existing attendees + user + any new ones in intent
        attendees_emails = [a.get("email") for a in target_event.attendees if a.get("email")]
        attendees_emails.append(user.email)
        if intent.attendees:
            attendees_emails = list(set(attendees_emails + intent.attendees))
            
        # get_free_busy returns Dict[str, List[TimeSlot]]
        free_busy_data = await calendar_provider.get_free_busy(
            calendar_ids=["primary"], 
            start_time=new_start_time, 
            end_time=new_end_time
        )
        
        # Check for overlaps in the primary calendar (excluding the event itself)
        primary_busy = free_busy_data.get("primary", [])
        conflict = any(
            not (new_end_time <= slot.start or new_start_time >= slot.end) 
            and slot.start != target_event.start
            for slot in primary_busy
        )
        
        if conflict:
            # Suggest alternatives if conflict found
            suggestions = await ai_scheduling_service.suggest_optimal_meeting_times(
                duration_minutes=int((new_end_time - new_start_time).total_seconds() / 60),
                attendees=attendees_emails,
                meeting_type=intent.meeting_type or "meeting",
                user_timezone=str(user.timezone)
            )
            
            response_text = "There is a conflict at that time."
            if suggestions.get("optimal_times"):
                times = "\n".join([f"• {s['time']}" for s in suggestions["optimal_times"][:3]])
                response_text += f" How about one of these instead?\n{times}"
            
            return ChatResponse(
                response=response_text,
                intent="reschedule",
                requires_clarification=True,
                suggestions=suggestions.get("optimal_times", [])
            )

        # 4. Perform the update using enhanced update_event
        # We wrap data in MeetingCreate as expected by the service
        from app.schemas.meeting import MeetingCreate, Attendee
        update_data = MeetingCreate(
            title=intent.title or target_event.summary,
            description=intent.description or target_event.description,
            start_time=new_start_time,
            end_time=new_end_time,
            attendees=[Attendee(email=e) for e in attendees_emails],
            provider="google"
        )
        
        updated_event = await calendar_provider.update_event(target_event.id, update_data)
        
        if updated_event:
            # Sync local DB
            meeting_result = await db.execute(
                select(Meeting).where(Meeting.external_event_id == target_event.id)
            )
            meeting = meeting_result.scalar_one_or_none()
            if meeting:
                meeting.start_time = updated_event.start
                meeting.end_time = updated_event.end
                meeting.title = updated_event.summary
                await db.commit()
            
            local_display = updated_event.start.astimezone(tz).strftime("%A at %I:%M %p")
            return ChatResponse(
                response=f"✅ Rescheduled '{updated_event.summary}' to {local_display}.",
                intent="reschedule",
                meeting={
                    "id": updated_event.id,
                    "title": updated_event.summary,
                    "start_time": updated_event.start.isoformat(),
                    "status": "rescheduled"
                }
            )
            
    except Exception as e:
        logger.error("chat_reschedule_failed", error=str(e))
        return ChatResponse(
            response="I ran into trouble rescheduling that meeting. Please try again later.",
            intent="reschedule"
        )


async def handle_query_availability(intent: ParsedIntent, user: User, calendar_provider) -> ChatResponse:
    """Handle availability query intent using enhanced service."""
    try:
        # Use user's timezone for correct day/time calculation
        try:
            tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
        except Exception:
            tz = ZoneInfo("UTC")

        # Default to today if no specific time provided
        now_local = datetime.now(tz)
        target_date = now_local.date()
        
        # Use enhanced service's get_availability method with duration support
        availability = await calendar_provider.get_availability(
            calendar_ids=["primary"],
            start_date=target_date,
            end_date=target_date,
            duration_minutes=30  # Default 30-minute meetings
        )
        
        if not availability or not availability.get("slots"):
            return ChatResponse(
                response=f"📅 You're completely free today ({target_date.strftime('%A, %B %d')})! Your calendar has no meetings.",
                intent="check_availability"
            )
        
        # Format available slots
        available_slots = []
        for slot in availability["slots"][:5]:  # Show up to 5 slots
            local_start = slot.start.astimezone(tz)
            local_end = slot.end.astimezone(tz)
            duration = int((slot.end - slot.start).total_seconds() / 60)
            available_slots.append(f"• {local_start.strftime('%I:%M %p')} – {local_end.strftime('%I:%M %p')} ({duration} min)")
        
        slots_text = "\n".join(available_slots)
        
        return ChatResponse(
            response=f"📅 Available time slots for {target_date.strftime('%A, %B %d')}:\n\n{slots_text}\n\nWould you like me to schedule a meeting in one of these slots?",
            intent="check_availability",
            availability=availability.get("slots", [])[:5]
        )
        
    except Exception as e:
        logger.error("chat_availability_failed", error=str(e))
        return ChatResponse(
            response="I couldn't check your availability right now. Please try again.",
            intent="check_availability"
        )


async def handle_find_optimal_time(intent: ParsedIntent, user: User, calendar_provider) -> ChatResponse:
    """Handle finding optimal meeting times with AI."""
    try:
        # Extract parameters from intent or use defaults
        duration = intent.duration_minutes or 60
        attendees = intent.attendees or [user.email]
        meeting_type = intent.meeting_type or "meeting"
        
        # Get AI suggestions for optimal times
        suggestions = await ai_scheduling_service.suggest_optimal_meeting_times(
            duration_minutes=duration,
            attendees=attendees,
            meeting_type=meeting_type,
            user_timezone=str(user.timezone),
            preferred_days=None,
            time_constraints={}
        )
        
        if suggestions.get("optimal_times"):
            times_text = "\n".join([
                f"• {suggestion['time']}: {suggestion['reason']}"
                for suggestion in suggestions["optimal_times"][:3]
            ])
            return ChatResponse(
                response=f"🎯 Here are the best times for your {meeting_type}:\n{times_text}\n\nWould you like me to schedule one of these?",
                intent="find_time",
                suggestions=suggestions.get("optimal_times", [])
            )
        else:
            return ChatResponse(
                response="I couldn't find optimal times right now. Would you like me to check your availability instead?",
                intent="find_time"
            )
            
    except Exception as e:
        logger.error("find_optimal_time_failed", error=str(e))
        return ChatResponse(
            response="I couldn't find optimal meeting times. Please try again.",
            intent="find_time"
        )


async def handle_ai_suggestions(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession) -> ChatResponse:
    """Handle AI-powered scheduling suggestions."""
    try:
        # Get user's recent meetings for analysis
        result = await db.execute(
            select(Meeting)
            .where(Meeting.user_id == user.id)
            .order_by(Meeting.start_time.desc())
            .limit(20)
        )
        recent_meetings = result.scalars().all()
        
        # Convert events to dict format for AI analysis
        events_data = []
        for meeting in recent_meetings:
            events_data.append({
                "title": meeting.title,
                "start_time": meeting.start_time.isoformat(),
                "end_time": meeting.end_time.isoformat(),
                "attendees": meeting.attendees,
                "status": meeting.status
            })
        
        # Get AI analysis and recommendations
        date_range = (
            datetime.now(timezone.utc) - timedelta(days=30),
            datetime.now(timezone.utc)
        )
        
        analysis = await ai_scheduling_service.analyze_calendar_patterns(
            events_data, str(user.timezone), date_range
        )
        
        if analysis.get("recommendations"):
            recommendations_text = "\n".join([
                f"• {rec.get('description', 'Suggestion')}"
                for rec in analysis["recommendations"][:5]
            ])
            return ChatResponse(
                response=f"🧠 Based on your calendar patterns, here are my suggestions:\n{recommendations_text}\n\nWould you like me to help implement any of these?",
                intent="suggest_times",
                analysis=analysis
            )
        else:
            return ChatResponse(
                response="I need more calendar data to provide personalized suggestions. Let's schedule a few more meetings first!",
                intent="suggest_times"
            )
            
    except Exception as e:
        logger.error("ai_suggestions_failed", error=str(e))
        return ChatResponse(
            response="I couldn't generate AI suggestions right now. Please try again.",
            intent="suggest_times"
        )


async def handle_list_meetings(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession) -> ChatResponse:
    """Handle listing meetings using enhanced service."""
    try:
        now_utc = datetime.now(timezone.utc)
        end_time = now_utc + timedelta(days=7)
        
        # Use the service's built-in get_events
        events = await calendar_provider.get_events(
            calendar_id="primary", 
            start_time=now_utc, 
            end_time=end_time
        )
        
        if not events:
            return ChatResponse(response="📅 No upcoming events found.", intent="list_meetings")
        
        # Format using CalendarEvent attributes
        events_text = []
        for event in events[:10]:
            local_time = event.start.astimezone(ZoneInfo(str(user.timezone)))
            events_text.append(f"• {event.summary} - {local_time.strftime('%A, %B %d at %I:%M %p')}")
        
        return ChatResponse(
            response=f"📅 Your upcoming events:\n{chr(10).join(events_text)}",
            intent="list_meetings",
            meetings=[{"id": e.id, "title": e.summary, "start_time": e.start.isoformat()} for e in events[:10]]
        )
    except Exception as e:
        logger.error("list_meetings_failed", error=str(e))
        return ChatResponse(response="I couldn't retrieve your events.", intent="list_meetings")
