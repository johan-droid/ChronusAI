# pyre-unsafe
# pyre-ignore-all-errors[21, 16, 6, 9, 58, 43]
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo

import structlog
import time as _time

from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.core.security import hash_user_id, token_encryptor
from app.db.session import get_db
from app.services.calendar_integration_service import fetch_live_calendar_events
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

logger = structlog.get_logger()

async def fetch_live_calendar_events(calendar_provider, user: User, start: datetime, end: datetime) -> list[dict]:
    """Helper to fetch and format live events for AI context."""
    try:
        # Assuming calendar_provider has a list_events method
        events = await calendar_provider.list_events(start, end)
        return [
            {
                "id": e.get("id"),
                "title": e.get("summary"),
                "start_time": e.get("start"),
                "attendees": [a.get("email") for a in e.get("attendees", [])]
            }
            for e in events
        ]
    except Exception as e:
        logger.warning("failed_to_fetch_live_events", error=str(e))
        return []

router = APIRouter(prefix="/chat", tags=["chat"])

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
    response = None  # Initialize response to prevent UnboundLocalError
    
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
        
        # Format live events for prompt injection (limit to 3 to save tokens)
        events_context = "No upcoming events in Google Calendar."
        if live_events:
            context_lines: list[str] = []
            for event in live_events[:3]:
                context_lines.append(
                    f'- ID: {event["id"]}, Title: "{event["title"]}", '
                    f'Start: {event["start_time"].isoformat()}, '
                    f'Attendees: {event["attendees"]}'
                )
            events_context = "\n".join(context_lines)
        
        # 2. Self-Correction Retry Loop (max 1 retry to save tokens)
        max_retries = 1
        parsed_intent = None
        last_error = None
        
        for attempt in range(max_retries + 1):
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
                    try:
                        datetime.fromisoformat(parsed_intent.start_time.replace('Z', '+00:00'))
                    except ValueError as e:
                        last_error = str(e)
                        continue
                
                # If we got here, parsing is successful
                break
            except Exception as e:
                last_error = str(e)
                # Check for specific LLM service errors like 402 Insufficient Balance
                if "402" in str(e) or "insufficient balance" in str(e).lower():
                    logger.error("ai_llm_insufficient_balance", error=str(e))
                    raise HTTPException(status_code=402, detail="insufficient_balance")
                
                if attempt == max_retries:
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
            result = await handle_create_meeting(
                parsed_intent, current_user, calendar_provider, db,
                raw_user_input=payload.message,
                explicit_reminder_minutes=getattr(payload, 'reminder_schedule_minutes', None),
                explicit_reminder_methods=getattr(payload, 'reminder_methods', None),
            )
        elif parsed_intent.intent == "cancel":
            result = await handle_cancel_meeting(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "reschedule":
            result = await handle_update_meeting(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "check_availability":
            result = await handle_query_availability(
                parsed_intent, current_user, calendar_provider
            )
        elif parsed_intent.intent == "find_time":
            result = await handle_find_optimal_time(
                parsed_intent, current_user, calendar_provider
            )
        elif parsed_intent.intent == "suggest_times":
            result = await handle_ai_suggestions(
                parsed_intent, current_user, calendar_provider, db
            )
        elif parsed_intent.intent == "list_meetings":
            result = await handle_list_meetings(
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
                try:
                    helpful_response = await llm_service.generate_helpful_response(
                        payload.message,
                        str(current_user.full_name or "User"),
                        str(current_user.email)
                    )
                    response = ChatResponse(
                        response=helpful_response,
                        intent="chat"
                    )
                except Exception as e:
                    # Fallback if LLM fails
                    logger.warning("helpful_response_generation_failed", error=str(e))
                    response = ChatResponse(
                        response="I'm here to help with your calendar and scheduling needs. Try asking me to 'schedule a meeting' or 'check my availability'!",
                        intent="chat"
                    )
        else:
            # Handle unknown intents with a fallback response
            response = ChatResponse(
                response="I'm not sure how to help with that. Try asking me to schedule a meeting, check your availability, or list your upcoming events.",
                intent="unknown"
            )

        # If we executed a handler, use the handler's own response text when it
        # already contains a user-facing message (starts with an icon or has
        # meaningful content).  Only fall back to generate_action_response for
        # sparse handler results – this eliminates a 2nd Gemini call in ~90% of
        # cases and is the single biggest token saver.
        if parsed_intent.intent not in ["chat", "unknown"] and 'result' in locals():
            handler_text = getattr(result, 'response', '') or ''
            # Handler already produced a good human response – reuse it directly
            if handler_text and len(handler_text) > 20:
                response = result  # ChatResponse from handler
            else:
                # Fall back to LLM explanation only when handler returned no text
                final_text = await llm_service.generate_action_response(
                    user_message=payload.message,
                    intent_data=parsed_intent,
                    action_result=result.dict() if 'result' in locals() else {},
                    history=context
                )
                response = ChatResponse(
                    response=final_text,
                    intent=parsed_intent.intent,
                    meetings=getattr(result, 'meetings', None),
                    availability=getattr(result, 'availability', None),
                    suggestions=getattr(result, 'suggestions', None)
                )
        
        # Add bot response to context
        if response and hasattr(response, 'response'):
            context.append({"role": "assistant", "content": response.response})
            await save_conversation_context(str(current_user.id), context)

        logger.info(
            "ai_chat_processed",
            user_id_hash=hash_user_id(str(current_user.id)),
            intent=parsed_intent.intent,
            outcome="clarification" if response and response.requires_clarification else "completed",
            duration_ms=int((_time.perf_counter() - start) * 1000),
        )
        
        # Final safety check: ensure response is always defined
        if response is None:
            response = ChatResponse(
                response="I'm having trouble processing your request. Please try again.",
                intent="ERROR"
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
        
        # Check for specific LLM service errors like 402 Insufficient Balance
        error_str = str(e).lower()
        if "402" in error_str or "insufficient balance" in error_str:
            logger.error("ai_llm_insufficient_balance_outer", error=str(e))
            raise HTTPException(status_code=402, detail="insufficient_balance")
        
        # Check for 401 Unauthorized errors
        if "401" in error_str or "unauthorized" in error_str:
            logger.error("ai_llm_unauthorized", error=str(e))
            raise HTTPException(status_code=401, detail="llm_unauthorized")
        
        # Enhanced error diagnostics using test_connection
        try:
            # Get the underlying calendar service for connection test
            if hasattr(calendar_provider, 'service'):
                connection_status = await calendar_provider.service.test_connection()
            else:
                # Fallback for providers without test_connection
                connection_status = {"success": True, "details": "Connection test not available for this provider"}
            
            if not connection_status.get("success", False):
                error_detail = connection_status.get("error", "Unknown calendar connection issue")
                return ChatResponse(
                    response=f"Calendar connection failed: {error_detail}",
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


async def handle_create_meeting(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession, raw_user_input: str, explicit_reminder_minutes=None, explicit_reminder_methods=None) -> ChatResponse:
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
            # prefer explicit payload values, fall back to AI-parsed intent
            reminder_schedule_minutes=explicit_reminder_minutes or getattr(intent, 'reminder_schedule_minutes', None) or getattr(intent, 'reminder_minutes', None),
            reminder_methods=explicit_reminder_methods or getattr(intent, 'reminder_methods', None),
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
            reminder_schedule_minutes=getattr(meeting_create, 'reminder_schedule_minutes', None),
            reminder_methods=getattr(meeting_create, 'reminder_methods', None),
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

        # Send immediate email notifications to attendees in background
        _reminder_confirmed = False
        try:
            from app.services.email import send_email

            attendees = [a.get('email') if isinstance(a, dict) else str(a) for a in meeting.attendees]
            subject = f"Meeting scheduled: {meeting.title}"
            meeting_time_local = local_start.strftime("%A, %B %d at %I:%M %p %Z")
            text_body = (
                f"Your meeting '{meeting.title}' has been scheduled for {meeting_time_local}.\n\n"
                f"Details:\n{meeting.description or ''}\n\nLink: {meeting.meeting_url or 'N/A'}\n\n"
                "This is an automated notification from ChronosAI."
            )
            html_body = (
                f"<p>Your meeting '<strong>{meeting.title}</strong>' has been scheduled for <strong>{meeting_time_local}</strong>.</p>"
                f"<p>{(meeting.description or '')}</p>"
                f"<p>Join: <a href=\"{meeting.meeting_url or '#'}\">{meeting.meeting_url or 'Open meeting'}</a></p>"
                f"<hr/><p><small>This is an automated notification from ChronosAI.</small></p>"
            )

            # Fire-and-forget: run in background so API response isn't delayed
            import asyncio as _asyncio
            _asyncio.create_task(send_email(attendees, subject, text_body, html_body))

            # Schedule multiple reminders before meeting based on settings
            try:
                from datetime import timedelta
                from app.services.scheduler import schedule_job
                from app.services.scheduler import remove_job
                from app.config import settings as _settings

                # Determine reminder minutes list: prefer per-meeting setting, then global settings
                if getattr(meeting_create, 'reminder_schedule_minutes', None):
                    schedule_minutes = list(meeting_create.reminder_schedule_minutes or [])
                elif _settings.reminder_schedule_minutes:
                    schedule_minutes = list(_settings.reminder_schedule_minutes)
                else:
                    schedule_minutes = [int(getattr(_settings, 'reminder_minutes_before', 15))]

                # Ensure unique increasing order and positive ints
                schedule_minutes = sorted({int(x) for x in schedule_minutes if int(x) >= 0})

                for minutes_before in schedule_minutes:
                    try:
                        run_at = meeting.start_time - timedelta(minutes=minutes_before)
                        # Skip past times
                        from datetime import datetime, timezone as _tz
                        if run_at <= datetime.now(_tz.utc):
                            continue

                        job_id = f"reminder-{meeting.id}-{minutes_before}"
                        schedule_job(
                            send_email,
                            run_date=run_at,
                            args=[attendees, f"Reminder: {meeting.title} (in {minutes_before} minutes)", text_body, html_body],
                            id=job_id,
                        )
                    except Exception:
                        logger.exception("failed_to_schedule_single_reminder", minutes_before=minutes_before)
            except Exception:
                logger.exception("failed_to_schedule_reminder")

            # Send a confirmation email to the organizer about the reminders that were set
            try:
                if schedule_minutes:
                    readable = ", ".join(
                        f"{m} min" if m < 60 else f"{m // 60} hr" if m < 1440 else f"{m // 1440} day"
                        for m in sorted(schedule_minutes)
                    )
                    methods_str = ", ".join(getattr(meeting_create, 'reminder_methods', None) or ["email"])
                    confirm_subject = f"✅ Reminder confirmed: {meeting.title}"
                    confirm_text = (
                        f"Hi {str(user.full_name or user.email)},\n\n"
                        f"Your reminder for '{meeting.title}' has been set successfully.\n\n"
                        f"Meeting: {meeting.title}\n"
                        f"When: {formatted_time}\n"
                        f"Reminders: {readable} before via {methods_str}\n\n"
                        f"You will receive reminder notifications at the scheduled times.\n\n"
                        "— ChronosAI"
                    )
                    confirm_html = (
                        f"<div style='font-family:sans-serif;max-width:520px'>"
                        f"<p>Hi <strong>{str(user.full_name or user.email)}</strong>,</p>"
                        f"<p>Your reminder for '<strong>{meeting.title}</strong>' has been set successfully.</p>"
                        f"<table style='border-collapse:collapse;margin:12px 0'>"
                        f"<tr><td style='padding:4px 12px 4px 0;color:#666'>Meeting</td><td><strong>{meeting.title}</strong></td></tr>"
                        f"<tr><td style='padding:4px 12px 4px 0;color:#666'>When</td><td>{formatted_time}</td></tr>"
                        f"<tr><td style='padding:4px 12px 4px 0;color:#666'>Reminders</td><td>{readable} before</td></tr>"
                        f"<tr><td style='padding:4px 12px 4px 0;color:#666'>Via</td><td>{methods_str}</td></tr>"
                        f"</table>"
                        f"<p style='color:#888;font-size:13px'>You will receive reminder notifications at the scheduled times.</p>"
                        f"<hr style='border:none;border-top:1px solid #eee'/>"
                        f"<p style='color:#aaa;font-size:12px'>ChronosAI — Automated Meeting Scheduler</p>"
                        f"</div>"
                    )
                    _asyncio.create_task(send_email([str(user.email)], confirm_subject, confirm_text, confirm_html))
                    _reminder_confirmed = True
            except Exception:
                logger.exception("failed_to_send_reminder_confirmation")
        except Exception:
            logger.exception("failed_to_enqueue_meeting_emails")

        return ChatResponse(
            response=f"✅ Meeting scheduled: {title} on {formatted_time}",
            intent="schedule",
            reminder_confirmed=_reminder_confirmed,
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
    """Handle availability query intent using enhanced service with future-only filter."""
    try:
        # Use user's timezone for correct day/time calculation
        try:
            tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
        except Exception:
            tz = ZoneInfo("UTC")

        # Default to today if no specific time provided
        now_local = datetime.now(tz)
        target_date = now_local.date()
        
        # Enhanced future-only filter: if checking today's availability, start from current time
        start_datetime = now_local  # Start from current time for today

        # End of business day: 8 PM local. If already past 8 PM, use midnight (next day start).
        end_of_day = start_datetime.replace(hour=20, minute=0, second=0, microsecond=0)
        if start_datetime >= end_of_day:
            return ChatResponse(
                response=f"📅 The workday is over for today ({target_date.strftime('%A, %B %d')}). No more availability slots remaining. Would you like to check tomorrow's availability?",
                intent="check_availability"
            )

        # Use get_free_busy to find availability
        busy_slots = await calendar_provider.get_free_busy(
            start=start_datetime,
            end=end_of_day,
            attendees=[str(user.email)]
        )
        
        # Calculate free slots (simplified logic for demonstration)
        # Assuming completely free if no busy slots exist
        if not busy_slots:
            return ChatResponse(
                response=f"📅 You're completely free today ({target_date.strftime('%A, %B %d')})! Your calendar has no meetings.",
                intent="check_availability"
            )
        
        # Filter available slots to only show future times (redundant but safe)
        future_slots = []
        last_end = start_datetime
        for busy in sorted(busy_slots, key=lambda x: x.start):
            # If there's a gap of at least 30 minutes before this busy slot
            if (busy.start - last_end).total_seconds() >= 1800:
                future_slots.append({'start': last_end, 'end': busy.start})
            last_end = max(last_end, busy.end)
            
        # Check time after last meeting until end of business day
        if (end_of_day - last_end).total_seconds() >= 1800:
            future_slots.append({'start': last_end, 'end': end_of_day})
            
        if not future_slots:
            return ChatResponse(
                response=f"📅 Your calendar is completely booked for the rest of today ({target_date.strftime('%A, %B %d')}).",
                intent="check_availability"
            )
        
        # Format available slots
        available_slots = []
        for slot in future_slots[:5]:  # Show up to 5 slots
            local_start = slot['start'].astimezone(tz)
            local_end = slot['end'].astimezone(tz)
            duration = int((slot['end'] - slot['start']).total_seconds() / 60)
            available_slots.append(f"• {local_start.strftime('%I:%M %p')} – {local_end.strftime('%I:%M %p')} ({duration} min)")
        
        slots_text = "\n".join(available_slots)
        
        return ChatResponse(
            response=f"📅 Available time slots for {target_date.strftime('%A, %B %d')} (from now):\n\n{slots_text}\n\nWould you like me to schedule a meeting in one of these slots?",
            intent="check_availability",
            availability=future_slots[:5]
        )
        
    except Exception as e:
        logger.error("chat_availability_failed", error=str(e))
        return ChatResponse(
            response="I couldn't check your availability right now. Please try again.",
            intent="check_availability"
        )


async def handle_find_optimal_time(intent: ParsedIntent, user: User, calendar_provider) -> ChatResponse:
    """Handle finding optimal meeting times with AI and future-only filter."""
    try:
        # Extract parameters from intent or use defaults
        duration = intent.duration_minutes or 60
        attendees = intent.attendees or [user.email]
        meeting_type = intent.meeting_type or "meeting"
        
        # Use user's timezone for accurate time calculations
        try:
            tz = ZoneInfo(str(user.timezone)) if user.timezone else ZoneInfo("UTC")
        except Exception:
            tz = ZoneInfo("UTC")
        
        now_local = datetime.now(tz)
        
        # Enhanced future-only filter: ensure AI doesn't suggest past times
        time_constraints = {
            "earliest_time": now_local.strftime('%H:%M'),  # Current time or later
            "exclude_past": True  # Explicit flag for AI service
        }
        
        # Get AI suggestions for optimal times with future-only constraint
        suggestions = await ai_scheduling_service.suggest_optimal_meeting_times(
            duration_minutes=duration,
            attendees=attendees,
            meeting_type=meeting_type,
            user_timezone=str(user.timezone),
            preferred_days=None,
            time_constraints=time_constraints
        )
        
        if suggestions.get("optimal_times"):
            # Additional filter to ensure all suggestions are in the future
            future_suggestions = [
                suggestion for suggestion in suggestions["optimal_times"]
                if datetime.strptime(suggestion['time'], '%H:%M').replace(tzinfo=tz) >= now_local
            ]
            
            times_text = "\n".join([
                f"• {suggestion['time']}: {suggestion['reason']}"
                for suggestion in future_suggestions[:3]
            ])
            return ChatResponse(
                response=f"🎯 Here are the best times for your {meeting_type} (from now):\n{times_text}\n\nWould you like me to schedule one of these?",
                intent="find_time",
                suggestions=future_suggestions[:3]
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
        # Strictly limit to recent data (last 7 days) for analysis
        retention_limit = datetime.now(timezone.utc) - timedelta(days=7)
        result = await db.execute(
            select(Meeting)
            .where(
                and_(
                    Meeting.user_id == user.id,
                    Meeting.start_time >= retention_limit
                )
            )
            .order_by(Meeting.start_time.desc())
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
        
        # Date range for pattern analysis: Last 7 days to Now
        date_range = (
            datetime.now(timezone.utc) - timedelta(days=7),
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
