"""
API router for chat endpoints.
Main natural language scheduling endpoint.
"""
import json
from datetime import datetime, timezone

import aioredis
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.redis import get_redis
from app.models.user import User, Meeting, OAuthCredentials
from app.models.oauth_credential import OAuthCredentials
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    MeetingInfo,
    ConversationContext,
    ConversationMessage,
)
from app.dependencies import get_current_user, get_oauth_credentials, check_token_expiry_and_refresh
from app.services.llm_service import llm_service, ParsedIntent
from app.services.scheduler_service import find_available_slot, search_multiple_days
from app.services.google_calendar import GoogleCalendarAdapter
from app.services.outlook_calendar import OutlookCalendarAdapter
from app.core.security import token_encryptor


router = APIRouter(prefix="/chat", tags=["Chat"])


async def get_calendar_adapter(provider: str, access_token: str):
    """Get the appropriate calendar adapter based on provider."""
    if provider == "google":
        return GoogleCalendarAdapter(access_token)
    else:  # outlook
        return OutlookCalendarAdapter(access_token)


async def save_conversation_context(
    redis: aioredis.Redis,
    user_id: str,
    context: ConversationContext,
):
    """Save conversation context to Redis with 24-hour TTL."""
    key = f"session:{user_id}"
    await redis.setex(
        key,
        86400,  # 24 hours in seconds
        context.model_dump_json(),
    )


async def load_conversation_context(
    redis: aioredis.Redis,
    user_id: str,
) -> ConversationContext:
    """Load conversation context from Redis."""
    key = f"session:{user_id}"
    data = await redis.get(key)
    
    if not data:
        return ConversationContext()
    
    try:
        return ConversationContext.model_validate_json(data)
    except Exception:
        return ConversationContext()


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    redis: aioredis.Redis = Depends(get_redis),
):
    """
    Main chat endpoint for natural language meeting scheduling.
    
    Processes user message, extracts intent via LLM, and executes scheduling actions.
    """
    # Load conversation context
    context = await load_conversation_context(redis, str(user.id))
    
    # Parse intent using LLM
    try:
        parsed_intent = await llm_service.parse_intent(
            message=request.message,
            user_timezone=user.timezone,
            conversation_history=[m.model_dump() for m in context.messages],
        )
    except Exception as e:
        return ChatResponse(
            response="I'm having trouble understanding your request. Could you please rephrase?",
            intent="UNKNOWN",
        )
    
    # Handle different intents
    response_text = ""
    meeting_info = None
    
    if parsed_intent.intent == "UNKNOWN":
        response_text = "I'm not sure how to help with that. I can assist with scheduling, rescheduling, or canceling meetings."
    
    elif parsed_intent.intent == "CREATE_MEETING":
        # Check if we have all required information
        if parsed_intent.clarification_needed:
            response_text = parsed_intent.clarification_needed
        elif not parsed_intent.target_date:
            response_text = "When would you like to schedule this meeting?"
        else:
            # We have enough info to proceed
            # Get OAuth credentials and calendar adapter
            from sqlalchemy import select
            
            result = await db.execute(
                select(OAuthCredentials).where(OAuthCredentials.user_id == user.id)
            )
            oauth_creds = result.scalar_one_or_none()
            
            if not oauth_creds:
                return ChatResponse(
                    response="Please connect your calendar first before scheduling meetings.",
                    intent=parsed_intent.intent,
                )
            
            # Decrypt tokens
            access_token = token_encryptor.decrypt(oauth_creds.access_token)
            
            # Check if token needs refresh
            from app.dependencies import check_token_expiry_and_refresh
            access_token = await check_token_expiry_and_refresh(
                oauth_creds, user, db, redis
            )
            
            # Get calendar adapter
            calendar = await get_calendar_adapter(user.provider, access_token)
            
            # Calculate time window for availability check
            from datetime import timedelta
            search_start = datetime.combine(parsed_intent.target_date, datetime.min.time())
            search_end = search_start + timedelta(days=1)
            
            # Make timezone-aware
            import pytz
            tz = pytz.timezone(user.timezone)
            search_start = tz.localize(search_start)
            search_end = tz.localize(search_end)
            
            # Get busy slots
            busy_slots = await calendar.get_free_busy(
                start=search_start.astimezone(timezone.utc),
                end=search_end.astimezone(timezone.utc),
                attendees=parsed_intent.attendees if parsed_intent.attendees else None,
            )
            
            # Find available slot
            duration = parsed_intent.duration_minutes or 30
            slot = find_available_slot(
                busy_slots=busy_slots,
                duration_minutes=duration,
                target_date=parsed_intent.target_date,
                time_preference=parsed_intent.time_preference,
                user_timezone=user.timezone,
            )
            
            if not slot:
                # Try searching multiple days
                result = search_multiple_days(
                    busy_slots=busy_slots,
                    duration_minutes=duration,
                    start_date=parsed_intent.target_date,
                    time_preference=parsed_intent.time_preference,
                    user_timezone=user.timezone,
                    max_days=7,
                )
                
                if not result:
                    response_text = "I couldn't find any available slots in the next 7 days. Could you try a different week?"
                else:
                    found_date, slot = result
                    response_text = f"I couldn't find availability on {parsed_intent.target_date}, but I found a slot on {found_date} at {slot.start.strftime('%I:%M %p')}. Would you like me to schedule it?"
                    # Store pending action
                    context.pending_action = {
                        "action": "create_meeting",
                        "intent": parsed_intent.model_dump(mode="json"),
                        "slot": {"start": slot.start.isoformat(), "end": slot.end.isoformat()},
                    }
            else:
                # Create the meeting
                title = parsed_intent.title or "Meeting"
                start_time = slot.start
                end_time = slot.end
                
                # Create event in calendar
                try:
                    external_id = await calendar.create_event(
                        title=title,
                        start_time=start_time,
                        end_time=end_time,
                        attendees=[str(a) for a in parsed_intent.attendees] if parsed_intent.attendees else None,
                    )
                    
                    # Save to database
                    meeting = Meeting(
                        user_id=user.id,
                        external_event_id=external_id,
                        title=title,
                        start_time=start_time,
                        end_time=end_time,
                        attendees=[{"email": str(a)} for a in parsed_intent.attendees] if parsed_intent.attendees else [],
                        status="scheduled",
                        provider=user.provider,
                        raw_user_input=request.message,
                    )
                    db.add(meeting)
                    await db.commit()
                    await db.refresh(meeting)
                    
                    response_text = f"✅ Meeting scheduled successfully!\n\n**{title}**\n📅 {start_time.strftime('%A, %B %d, %Y')}\n⏰ {start_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')} ({user.timezone})"
                    
                    meeting_info = MeetingInfo(
                        id=str(meeting.id),
                        title=title,
                        start_time=start_time.isoformat(),
                        end_time=end_time.isoformat(),
                        attendees=[{"email": str(a)} for a in parsed_intent.attendees] if parsed_intent.attendees else [],
                        status="scheduled",
                    )
                    
                except Exception as e:
                    response_text = f"Sorry, I encountered an error while creating the meeting: {str(e)}"
    
    elif parsed_intent.intent == "CANCEL_MEETING":
        response_text = "To cancel a meeting, I need to know which one. Could you provide the meeting title or date?"
        # Implementation would search for matching meetings and delete them
    
    elif parsed_intent.intent == "UPDATE_MEETING":
        response_text = "To reschedule a meeting, please tell me which meeting and the new time."
        # Implementation would find the meeting and update it
    
    elif parsed_intent.intent == "QUERY_AVAILABILITY":
        response_text = "Let me check your availability..."
        # Implementation would return free slots
    
    # Update conversation context
    context.messages.append(ConversationMessage(role="user", content=request.message))
    context.messages.append(ConversationMessage(role="assistant", content=response_text))
    context.last_intent = parsed_intent.intent
    
    # Keep only last 6 messages (3 turns)
    if len(context.messages) > 6:
        context.messages = context.messages[-6:]
    
    # Save context
    await save_conversation_context(redis, str(user.id), context)
    
    return ChatResponse(
        response=response_text,
        intent=parsed_intent.intent,
        meeting=meeting_info,
    )


@router.get("/history")
async def get_chat_history(
    user: User = Depends(get_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Get conversation history for the current user."""
    context = await load_conversation_context(redis, str(user.id))
    return {"messages": [m.model_dump() for m in context.messages]}


@router.delete("/history")
async def clear_chat_history(
    user: User = Depends(get_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Clear conversation history for the current user."""
    key = f"session:{str(user.id)}"
    await redis.delete(key)
    return {"message": "Chat history cleared"}
