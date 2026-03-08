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
        
        # Parse user intent with enhanced AI
        parsed_intent = await llm_service.parse_intent(
            str(payload.message),
            str(current_user.timezone),
            str(current_user.email),
            str(current_user.full_name or "User"),
            context,
        )
        
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
                intent="cancel",
            )

        if getattr(meeting, "zoom_meeting_id", None):
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
                try:
                    from app.core.zoom import ZoomClient
                    zoom_client = ZoomClient(token_encryptor.decrypt(zoom_cred.access_token))
                    await zoom_client.delete_meeting(meeting.zoom_meeting_id)
                except Exception as ze:
                    logger.warning("zoom_delete_on_cancel_failed", error=str(ze))

        if meeting.external_event_id:
            await calendar_provider.delete_event(meeting.external_event_id)

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


async def handle_update_meeting(intent: ParsedIntent, user: User, calendar_provider, db: AsyncSession) -> ChatResponse:
    """Handle meeting update/reschedule intent with AI intelligence."""
    try:
        # Parse new time from intent
        if not intent.start_time:
            return ChatResponse(
                response="I need to know when you'd like to reschedule the meeting to. Could you specify a new date and time?",
                intent="reschedule",
                requires_clarification=True,
            )
        
        # Parse datetime from ISO string
        try:
            new_start_time = datetime.fromisoformat(intent.start_time.replace('Z', '+00:00'))
            if intent.end_time:
                new_end_time = datetime.fromisoformat(intent.end_time.replace('Z', '+00:00'))
            else:
                # Default 30 minutes or calculate from existing meeting
                new_end_time = new_start_time + timedelta(minutes=30)
        except Exception:
            return ChatResponse(
                response="I couldn't understand the new time format. Please try again with a clearer date and time.",
                intent="reschedule",
                requires_clarification=True,
            )
        
        # Find the most recent scheduled meeting to reschedule
        result = await db.execute(
            select(Meeting)
            .where(and_(Meeting.user_id == user.id, Meeting.status == "scheduled"))
            .order_by(Meeting.start_time.asc())
            .limit(1)
        )
        meeting = result.scalar_one_or_none()
        
        if not meeting:
            return ChatResponse(
                response="No scheduled meetings found to reschedule. Would you like to schedule a new meeting instead?",
                intent="reschedule"
            )
        
        # Check for conflicts at new time
        attendees_emails = [attendee.get("email") for attendee in meeting.attendees if attendee.get("email")]
        attendees_emails.append(user.email)
        
        busy_slots = await calendar_provider.get_free_busy(
            new_start_time, new_end_time, attendees_emails
        )
        
        # Check if new slot conflicts (excluding the current meeting)
        conflict = any(
            not (new_end_time <= b.start or new_start_time >= b.end) 
            and b.start != meeting.start_time
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

            if getattr(meeting, "zoom_meeting_id", None):
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
                    try:
                        from app.core.zoom import ZoomClient
                        zoom_client = ZoomClient(token_encryptor.decrypt(zoom_cred.access_token))
                        await zoom_client.update_meeting(
                            meeting.zoom_meeting_id,
                            topic=intent.title or meeting.title,
                            start_time=new_start_time,
                            duration_minutes=int((new_end_time - new_start_time).total_seconds() / 60),
                        )
                    except Exception as ze:
                        logger.warning("zoom_update_on_reschedule_failed", error=str(ze))

            updated_meeting = MeetingCreate(
                title=intent.title or meeting.title,
                description=intent.description or meeting.description,
                start_time=new_start_time,
                end_time=new_end_time,
                attendees=[Attendee(email=e) for e in attendees_emails],
                provider=str(user.provider),
                raw_user_input=f"Rescheduled: {meeting.title}",
            )

            await calendar_provider.update_event(meeting.external_event_id, updated_meeting)
            
            # Update in database
            meeting.title = updated_meeting.title
            meeting.description = updated_meeting.description
            meeting.start_time = updated_meeting.start_time
            meeting.end_time = updated_meeting.end_time
            meeting.attendees = [a.model_dump() for a in updated_meeting.attendees]
            meeting.raw_user_input = f"Rescheduled: {meeting.title}"
            
            await db.commit()
            await db.refresh(meeting)
            
            # Format response with local time
            try:
                local_time = new_start_time.astimezone(ZoneInfo(str(user.timezone)))
                formatted_time = local_time.strftime("%A, %B %d at %I:%M %p")
            except Exception:
                formatted_time = new_start_time.strftime("%A, %B %d at %I:%M %p")
            
            logger.info(
                "chat_meeting_rescheduled",
                user_id_hash=hash_user_id(str(user.id)),
                provider=user.provider,
                meeting_id=str(meeting.id),
                new_time=new_start_time.isoformat()
            )
            
            return ChatResponse(
                response=f"✅ Meeting rescheduled: {meeting.title} to {formatted_time}",
                intent="reschedule",
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
    """Handle listing meetings with AI intelligence."""
    try:
        # Get upcoming meetings
        result = await db.execute(
            select(Meeting)
            .where(
                and_(
                    Meeting.user_id == user.id,
                    Meeting.start_time > datetime.now(timezone.utc),
                    Meeting.status == "scheduled"
                )
            )
            .order_by(Meeting.start_time.asc())
            .limit(10)
        )
        meetings = result.scalars().all()
        
        if not meetings:
            return ChatResponse(
                response="📅 You have no upcoming meetings scheduled.",
                intent="list_meetings"
            )
        
        # Format meetings with AI insights
        meetings_text = []
        for meeting in meetings:
            try:
                local_time = meeting.start_time.astimezone(ZoneInfo(str(user.timezone)))
                formatted_time = local_time.strftime("%A, %B %d at %I:%M %p")
                meetings_text.append(f"• {meeting.title} - {formatted_time}")
            except Exception:
                meetings_text.append(f"• {meeting.title} - {meeting.start_time}")
        
        return ChatResponse(
            response=f"📅 Your upcoming meetings:\n{chr(10).join(meetings_text)}\n\nWould you like me to help you manage any of these?",
            intent="list_meetings",
            meetings=[{
                "id": str(m.id),
                "title": m.title,
                "start_time": m.start_time.isoformat(),
                "end_time": m.end_time.isoformat()
            } for m in meetings]
        )
        
    except Exception as e:
        logger.error("list_meetings_failed", error=str(e))
        return ChatResponse(
            response="I couldn't retrieve your meetings. Please try again.",
            intent="list_meetings"
        )
