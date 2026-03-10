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


async def fetch_live_calendar_events(calendar_provider, user: User, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
    """Fetch live events from Google Calendar API - the true source of truth."""
    try:
        events = await calendar_provider.list_events(start_time, end_time)
        # Filter for future events and add metadata
        live_events = []
        for event in events:
            event_start = event.get('start', {}).get('dateTime') or event.get('start', {}).get('date')
            if event_start:
                try:
                    start_dt = datetime.fromisoformat(event_start.replace('Z', '+00:00'))
                    if start_dt >= datetime.now(timezone.utc):
                        live_events.append({
                            'id': event.get('id', ''),
                            'title': event.get('summary', 'Untitled'),
                            'start_time': start_dt,
                            'end_time': datetime.fromisoformat(
                                (event.get('end', {}).get('dateTime') or event.get('end', {}).get('date'))
                                .replace('Z', '+00:00')
                            ),
                            'attendees': [attendee.get('email', '') for attendee in event.get('attendees', [])],
                            'description': event.get('description', ''),
                            'location': event.get('location', ''),
                            'status': event.get('status', 'confirmed')
                        })
                except Exception:
                    continue
        return live_events
    except Exception as e:
        logger.error("fetch_live_events_failed", error=str(e))
        return []


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
    """Handle meeting cancellation intent using live events."""
    try:
        now_utc = datetime.now(timezone.utc)
        end_time = now_utc + timedelta(days=7)
        
        # Fetch live events from Google Calendar
        live_events = await fetch_live_calendar_events(calendar_provider, user, now_utc, end_time)
        
        if not live_events:
            return ChatResponse(
                response="No upcoming events found to cancel.",
                intent="cancel",
            )
        
        # Find event by ID if provided, otherwise by title
        target_event = None
        
        # Check if intent has event_id (preferred method)
        if hasattr(intent, 'event_id') and intent.event_id:
            target_event = next((e for e in live_events if e['id'] == intent.event_id), None)
        
        # Fallback: find by exact title match
        if not target_event and intent.title:
            target_event = next((e for e in live_events if e['title'].lower() == intent.title.lower()), None)
        
        # If still not found, try partial match (less reliable)
        if not target_event and intent.title:
            target_event = next((e for e in live_events if intent.title.lower() in e['title'].lower()), None)
        
        if not target_event:
            return ChatResponse(
                response="I couldn't find that event. Would you like me to list your upcoming events?",
                intent="cancel",
            )
        
        # Cancel the event in Google Calendar
        success = await calendar_provider.delete_event(target_event['id'])
        
        if success:
            # Also update local DB if meeting exists
            meeting_result = await db.execute(
                select(Meeting).where(
                    and_(
                        Meeting.user_id == user.id,
                        Meeting.external_event_id == target_event['id']
                    )
                )
            )
            meeting = meeting_result.scalar_one_or_none()
            if meeting:
                meeting.status = "canceled"  # type: ignore[assignment]
                await db.commit()
            
            return ChatResponse(
                response=f"❌ Event '{target_event['title']}' has been canceled.",
                intent="cancel"
            )
        else:
            return ChatResponse(
                response="I couldn't cancel that event. Please try again or check your calendar connection.",
                intent="cancel"
            )
        
    except Exception as e:
        logger.error("chat_cancel_meeting_failed", error=str(e))
        return ChatResponse(
            response="I couldn't cancel that event right now. Please try again.",
            intent="cancel"
        )


async def handle_update_meeting(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession) -> ChatResponse:
    """Handle meeting update/reschedule intent with AI intelligence."""
    try:
        # Parse new time from local time string
        if not intent.start_time:
            return ChatResponse(
                response="I need to know when you'd like to reschedule the meeting to. Could you specify a new date and time?",
                intent="reschedule",
                requires_clarification=True,
            )
        
        # Convert local time to UTC
        try:
            local_start = datetime.fromisoformat(intent.start_time)
            if local_start.tzinfo is None:
                tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
                local_start = local_start.replace(tzinfo=tz)
            new_start_time = local_start.astimezone(timezone.utc)
                
            if intent.end_time:
                local_end = datetime.fromisoformat(intent.end_time)
                if local_end.tzinfo is None:
                    tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
                    local_end = local_end.replace(tzinfo=tz)
                new_end_time = local_end.astimezone(timezone.utc)
            else:
                new_end_time = new_start_time + timedelta(minutes=30)
        except Exception:
            return ChatResponse(
                response="I couldn't understand the new time format. Please try again with a clearer date and time.",
                intent="reschedule",
                requires_clarification=True,
            )
        
        now_utc = datetime.now(timezone.utc)
        end_time = now_utc + timedelta(days=7)
        
        # Fetch live events from Google Calendar
        live_events = await fetch_live_calendar_events(calendar_provider, user, now_utc, end_time)
        
        if not live_events:
            return ChatResponse(
                response="No upcoming events found to reschedule.",
                intent="reschedule"
            )
        
        # Find event by ID if provided, otherwise by title
        target_event = None
        
        # Check if intent has event_id (preferred method)
        if hasattr(intent, 'event_id') and intent.event_id:
            target_event = next((e for e in live_events if e['id'] == intent.event_id), None)
        
        # Fallback: find by exact title match
        if not target_event and intent.title:
            target_event = next((e for e in live_events if e['title'].lower() == intent.title.lower()), None)
        
        # If still not found, try partial match (less reliable)
        if not target_event and intent.title:
            target_event = next((e for e in live_events if intent.title.lower() in e['title'].lower()), None)
        
        if not target_event:
            return ChatResponse(
                response="I couldn't find that event to reschedule. Would you like me to list your upcoming events?",
                intent="reschedule"
            )
        
        # Check for conflicts at new time
        attendees_emails = [attendee.get("email") for attendee in target_event['attendees'] if attendee.get("email")]
        attendees_emails.append(user.email)
        
        # Add any new attendees from intent
        if intent.attendees:
            attendees_emails = list(set(attendees_emails + intent.attendees))
        
        busy_slots = await calendar_provider.get_free_busy(
            new_start_time, new_end_time, attendees_emails
        )
        
        # Check if new slot conflicts (excluding the current event)
        conflict = any(
            not (new_end_time <= b.start or new_start_time >= b.end) 
            and b.start != target_event['start_time']
            for b in busy_slots
        )
        
        if conflict:
            # Use AI to suggest alternative times
            from app.services.ai_scheduling_service import ai_scheduling_service
            
            suggestions = await ai_scheduling_service.suggest_optimal_meeting_times(
                duration_minutes=int((new_end_time - new_start_time).total_seconds() / 60),
                attendees=attendees_emails,
                meeting_type=intent.meeting_type or "meeting",
                user_timezone=str(user.timezone)
            )
            
            if suggestions.get("optimal_times"):
                times_text = "\n".join([
                    f"• {suggestion['time']}: {suggestion['reason']}"
                    for suggestion in suggestions["optimal_times"][:3]
                ])
                return ChatResponse(
                    response=f"There's a scheduling conflict at that time. Here are some alternatives:\n{times_text}\n\nWould you like me to reschedule to one of these?",
                    intent="reschedule",
                    requires_clarification=True,
                    suggestions=suggestions.get("optimal_times", [])
                )
            else:
                return ChatResponse(
                    response="There's a scheduling conflict at that time. Would you like me to check your availability and suggest alternatives?",
                    intent="reschedule",
                    requires_clarification=True
                )
        
        try:
            from app.schemas.meeting import MeetingCreate, Attendee

            # Create updated meeting object
            updated_meeting = MeetingCreate(
                title=intent.title or target_event['title'],
                description=intent.description or target_event['description'],
                start_time=new_start_time,
                end_time=new_end_time,
                attendees=[Attendee(email=e) for e in attendees_emails],
                provider=str(user.provider),
                raw_user_input=f"Rescheduled: {target_event['title']}",
            )

            # Update the event in Google Calendar
            success = await calendar_provider.update_event(target_event['id'], updated_meeting)
            
            if success:
                # Also update local DB if meeting exists
                meeting_result = await db.execute(
                    select(Meeting).where(
                        and_(
                            Meeting.user_id == user.id,
                            Meeting.external_event_id == target_event['id']
                        )
                    )
                )
                meeting = meeting_result.scalar_one_or_none()
                if meeting:
                    meeting.title = updated_meeting.title
                    meeting.description = updated_meeting.description
                    meeting.start_time = updated_meeting.start_time
                    meeting.end_time = updated_meeting.end_time
                    meeting.attendees = [a.model_dump() for a in updated_meeting.attendees]
                    meeting.raw_user_input = f"Rescheduled: {meeting.title}"
                    await db.commit()
                
                # Format response with local time
                try:
                    local_time = new_start_time.astimezone(ZoneInfo(str(user.timezone)))
                    formatted_time = local_time.strftime("%A, %B %d at %I:%M %p")
                except Exception:
                    formatted_time = new_start_time.strftime("%A, %B %d at %I:%M %p")
                
                logger.info(
                    "chat_event_rescheduled",
                    user_id_hash=hash_user_id(str(user.id)),
                    provider=user.provider,
                    event_id=target_event['id'],
                    new_time=new_start_time.isoformat()
                )
                
                return ChatResponse(
                    response=f"✅ Event rescheduled: {target_event['title']} to {formatted_time}",
                    intent="reschedule",
                    meeting={
                        "id": target_event['id'],
                        "title": updated_meeting.title,
                        "start_time": updated_meeting.start_time.isoformat(),
                        "end_time": updated_meeting.end_time.isoformat(),
                        "attendees": [a.model_dump() for a in updated_meeting.attendees],
                        "status": "rescheduled"
                    }
                )
            else:
                return ChatResponse(
                    response="I had trouble updating the event in your calendar. Please try again or check your calendar connection.",
                    intent="reschedule"
                )
            
        except Exception as e:
            logger.error("calendar_update_failed", error=str(e))
            return ChatResponse(
                response="I had trouble updating the meeting in your calendar. Please try again or check your calendar connection.",
                intent="reschedule"
            )
        
    except Exception as e:
        logger.error("chat_reschedule_failed", error=str(e))
        return ChatResponse(
            response="I couldn't reschedule that meeting right now. Please try again.",
            intent="reschedule"
        )


async def handle_query_availability(intent: ParsedIntent, user: User, calendar_provider) -> ChatResponse:
    """Handle availability query intent."""
    try:
        # Use user's timezone for correct day/time calculation
        try:
            tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
        except Exception:
            tz = ZoneInfo("UTC")

        # Default to today if no specific time provided
        now_local = datetime.now(tz)
        target_date = now_local.date()
        
        # Working hours: 8 AM to 8 PM in user's timezone
        start_of_day = datetime.combine(target_date, time(8, 0)).replace(tzinfo=tz)
        end_of_day = datetime.combine(target_date, time(20, 0)).replace(tzinfo=tz)
        
        busy_slots = await calendar_provider.get_free_busy(
            start_of_day, end_of_day, [user.email]
        )
        
        if not busy_slots:
            return ChatResponse(
                response=f"📅 You're completely free today ({target_date.strftime('%A, %B %d')})! Your calendar has no meetings between 8 AM and 8 PM.",
                intent="check_availability"
            )
        
        # Format busy times and find free slots
        busy_times = []
        for slot in busy_slots:
            try:
                local_start = slot.start.astimezone(tz)
                local_end = slot.end.astimezone(tz)
                busy_times.append(f"• {local_start.strftime('%I:%M %p')} – {local_end.strftime('%I:%M %p')}")
            except Exception:
                busy_times.append(f"• {slot.start.strftime('%I:%M %p')} – {slot.end.strftime('%I:%M %p')}")
        
        busy_text = "\n".join(busy_times)
        free_count = max(0, 24 - len(busy_slots) * 2)  # Rough estimate of 30-min free slots
        
        return ChatResponse(
            response=f"📅 Here's your schedule for {target_date.strftime('%A, %B %d')}:\n\n**Busy:**\n{busy_text}\n\nYou have approximately {free_count} free 30-minute slots between 8 AM – 8 PM. Would you like me to suggest a time for a meeting?",
            intent="check_availability"
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
    """Handle listing meetings using live Google Calendar data."""
    try:
        # Fetch live events from Google Calendar
        now_utc = datetime.now(timezone.utc)
        end_time = now_utc + timedelta(days=7)
        
        live_events = await fetch_live_calendar_events(calendar_provider, user, now_utc, end_time)
        
        if not live_events:
            return ChatResponse(
                response="📅 You have no upcoming events scheduled.",
                intent="list_meetings"
            )
        
        # Format events with local time
        events_text = []
        for event in live_events[:10]:  # Limit to 10 events
            try:
                local_time = event['start_time'].astimezone(ZoneInfo(str(user.timezone)))
                formatted_time = local_time.strftime("%A, %B %d at %I:%M %p")
                events_text.append(f"• {event['title']} - {formatted_time}")
            except Exception:
                events_text.append(f"• {event['title']} - {event['start_time']}")
        
        return ChatResponse(
            response=f"📅 Your upcoming events:\n{chr(10).join(events_text)}\n\nWould you like me to help you manage any of these?",
            intent="list_meetings",
            meetings=[{
                "id": event['id'],
                "title": event['title'],
                "start_time": event['start_time'].isoformat(),
                "end_time": event['end_time'].isoformat(),
                "attendees": event['attendees']
            } for event in live_events[:10]]
        )
        
    except Exception as e:
        logger.error("list_meetings_failed", error=str(e))
        return ChatResponse(
            response="I couldn't retrieve your events. Please try again.",
            intent="list_meetings"
        )
