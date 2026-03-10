# pyre-unsafe
import json
from datetime import datetime, timezone
from typing import Any, List, Dict

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )
        self.model = "deepseek-chat"  # DeepSeek model

    @staticmethod
    def _enhanced_system_prompt(
        user_timezone: str, 
        user_email: str, 
        user_name: str,
        upcoming_events_context: str = ""
    ) -> str:
        now_utc = datetime.now(timezone.utc)
        current_utc_iso = now_utc.isoformat()
        current_day = now_utc.strftime("%A, %B %d, %Y")
        
        return f"""You are ChronosAI, a scheduling assistant. Your goal is to parse user intent into a structured JSON.

CONTEXT:
- Current Time (UTC): {current_utc_iso}
- User Timezone: {user_timezone}
- User Info: {user_name} ({user_email})
- LIVE CALENDAR DATA (Source of Truth):
{upcoming_events_context}

INTENTS:
- schedule: Create a new meeting
- cancel: Delete an existing meeting (match by ID if possible)
- reschedule: Move an existing meeting to a new time
- check_availability: Check if a slot is free
- list_meetings: Show upcoming events
- find_time: Find optimal meeting times
- suggest_times: Suggest time options
- unknown: Unable to determine intent

RULES:
1. Always output ONLY valid JSON with the exact schema below
2. For dates/times, use ISO 8601 format in USER'S LOCAL TIMEZONE (e.g., 2026-03-10T14:00:00)
3. If an event ID is mentioned or matched from context, include it as 'event_id'
4. If info is missing, set intent but keep fields null and provide a 'response' asking for details
5. EMAIL VALIDATION: Attendees MUST be valid email addresses. If names are provided, ask for emails
6. For cancel/reschedule, use exact event_id from LIVE CALENDAR DATA when possible
7. Handle relative dates like 'tomorrow' based on current day: {current_day}

JSON SCHEMA:
{{
  "intent": "schedule|cancel|reschedule|check_availability|list_meetings|find_time|suggest_times|unknown",
  "title": "string or null",
  "start_time": "ISO_DATE string or null",
  "end_time": "ISO_DATE string or null",
  "event_id": "string or null",
  "attendees": ["email1@example.com", "email2@example.com"],
  "response": "optional friendly message or null",
  "requires_clarification": true/false,
  "meeting_type": "meeting|call|review|presentation|null",
  "description": "string or null"
}}

EXAMPLES:
"Schedule a meeting for tomorrow at 2pm" -> 
{{"intent":"schedule", "title":"Meeting", "start_time":"2026-03-10T14:00:00", "end_time":"2026-03-10T14:30:00", "attendees":[], "response":"I'll schedule that for you. Do you want to add anyone else?", "requires_clarification":false}}

"Cancel meeting with John" -> 
{{"intent":"cancel", "event_id":"abc123", "title":"meeting with John", "attendees":["john@example.com"], "response":"I'll cancel your meeting with John.", "requires_clarification":false}}

SELF-CORRECTION:
If you see a "Safety Warning" in context, it means your previous output had an error. Fix the specific issue mentioned:
- Invalid ISO format: Use proper YYYY-MM-DDTHH:MM:SS format
- Invalid email: Use proper email@domain.com format
- Missing event_id: Use the exact ID from LIVE CALENDAR DATA
- Timezone issues: Output in user's local timezone without 'Z'
"""

    async def parse_intent(
        self, 
        user_input: str, 
        timezone: str, 
        user_email: str, 
        user_name: str,
        context: List[Dict[str, Any]],
        upcoming_events_context: str = ""
    ) -> ParsedIntent:
        """Parse user message into structured meeting intent using DeepSeek AI with JSON mode."""
        try:
            # Build enhanced system prompt with events context
            system_prompt = self._enhanced_system_prompt(
                timezone, user_email, user_name, upcoming_events_context
            )
            
            messages: List[Dict[str, str]] = [
                {"role": "system", "content": system_prompt},
            ]
            
            # Add context (last 6 messages for better context awareness)
            context_slice = context[-6:]  # pyre-ignore[6]
            for item in context_slice:
                role = item.get("role")
                content_ctx = item.get("content", "")
                if role in ["user", "assistant", "system"]:
                    messages.append({"role": str(role), "content": str(content_ctx)})
            
            messages.append({"role": "user", "content": user_input})
            
            # Use JSON mode for structured output
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=messages,  # type: ignore[arg-type]
                response_format={"type": "json_object"},  # Essential for DeepSeek JSON mode
                temperature=0.1,  # Low temperature for deterministic parsing
                max_tokens=1000,
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from DeepSeek")
            
            # Parse JSON response (DeepSeek with JSON mode should return clean JSON)
            try:
                parsed_data = json.loads(content.strip())
                return ParsedIntent(**parsed_data)
            except json.JSONDecodeError as e:
                # Log the error for debugging
                print(f"JSON parsing error: {e}")
                print(f"Raw content: {content}")
                
                # Fallback with error handling
                return ParsedIntent(
                    intent="unknown",
                    response="I'm having trouble processing your request. Could you please rephrase your message?",
                    requires_clarification=True
                )
                
        except Exception as e:
            # Enhanced error logging
            print(f"LLM service error: {e}")
            return ParsedIntent(
                intent="unknown",
                response="I'm experiencing technical difficulties. Please try again in a moment.",
                requires_clarification=True
            )
    
    async def generate_helpful_response(self, message: str, user_name: str, user_email: str) -> str:
        """Generate helpful AI response for general queries."""
        try:
            system_prompt = f"""You are ChronosAI, a friendly and intelligent meeting assistant helping {user_name} ({user_email}). 
            You have full access to their Google Calendar and can help with scheduling, rescheduling, and managing meetings.
            Be conversational, helpful, and proactive. If you can help with scheduling, offer specific suggestions."""
            
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=500,
            )
            
            return response.choices[0].message.content or "I'm here to help with your calendar and scheduling needs!"
        except Exception:
            return "I'm here to help with your calendar and scheduling needs. Try asking me to 'schedule a meeting' or 'check my availability'!"

    async def generate_completion(self, prompt: str) -> str:
        """Generate simple completion for given prompt."""
        try:
            response = await self._client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=100,
            )
            return response.choices[0].message.content or ""
        except Exception:
            return ""


llm_service = LLMService()