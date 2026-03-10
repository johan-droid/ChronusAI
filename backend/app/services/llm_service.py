# pyre-unsafe
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self):
        # DeepSeek uses the OpenAI SDK structure
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,  # Use existing config
            base_url=settings.openai_base_url,  # Use existing config
        )
        self.model = "deepseek-chat"

    async def parse_intent(
        self, 
        message: str, 
        user_tz: str, 
        user_email: str, 
        user_name: str,
        history: List[Dict[str, str]],
        upcoming_events_context: str
    ) -> ParsedIntent:
        """
        Parses user natural language into a structured ParsedIntent JSON.
        Optimized for DeepSeek with enhanced GoogleCalendarService integration.
        """
        
        system_instructions = f"""
        You are the Intent Parser for ChronosAI. Your ONLY job is to output a JSON object.
        
        CURRENT CONTEXT:
        - Time (UTC): {datetime.now(timezone.utc).isoformat()}
        - User: {user_name} ({user_email})
        - Timezone: {user_tz}
        
        LIVE CALENDAR STATE (Source of Truth):
        {upcoming_events_context}

        TASK:
        Convert the user's message into the following JSON schema:
        {{
            "intent": "schedule" | "cancel" | "reschedule" | "check_availability" | "list_meetings" | "chat" | "find_time" | "suggest_times" | "unknown",
            "title": "string or null",
            "start_time": "ISO 8601 string or null",
            "end_time": "ISO 8601 string or null",
            "event_id": "The exact ID from the Live Calendar State if referencing an existing event",
            "attendees": ["list of emails"],
            "response": "Brief acknowledgment or clarification question",
            "requires_clarification": true/false,
            "meeting_type": "meeting|call|review|presentation|null",
            "description": "string or null"
        }}

        STRICT RULES:
        1. ID MATCHING: If the user wants to cancel or reschedule, find the 'ID' from the LIVE CALENDAR STATE that matches their description.
        2. TIMEZONE: All 'start_time' and 'end_time' values must be in the user's local timezone format (ISO 8601).
        3. ERROR HANDLING: If you are missing a date for 'schedule', set intent to 'schedule' but keep times null and use 'response' to ask for the date.
        4. CHAT: If the user is just saying hello or asking general questions, use the 'chat' intent.
        5. EMAIL VALIDATION: Attendees MUST be valid email addresses (e.g., user@example.com).
        6. RELATIVE DATES: Calculate relative dates like 'tomorrow' based on current UTC time.
        7. EVENT TARGETING: Use exact event_id from LIVE CALENDAR STATE for cancel/reschedule operations.

        EXAMPLES:
        "Schedule meeting with John tomorrow at 2pm" ->
        {{"intent":"schedule","title":"meeting with John","start_time":"2026-03-10T14:00:00","end_time":"2026-03-10T14:30:00","attendees":["john@example.com"],"response":"I'll schedule that meeting with John for tomorrow at 2pm.","requires_clarification":false}}

        "Cancel my sync meeting" ->
        {{"intent":"cancel","event_id":"abc123","title":"sync meeting","response":"I'll cancel your sync meeting.","requires_clarification":false}}

        "Check availability" ->
        {{"intent":"check_availability","response":"I'll check your availability.","requires_clarification":false}}

        "Hello" ->
        {{"intent":"chat","response":"Hello! How can I help you with your calendar today?","requires_clarification":false}}

        SELF-CORRECTION:
        If you see a "Safety Warning" in history, fix the specific error mentioned:
        - Invalid ISO format: Use proper YYYY-MM-DDTHH:MM:SS format
        - Invalid email: Use proper email@domain.com format  
        - Missing event_id: Use exact ID from LIVE CALENDAR STATE
        - Timezone issues: Output in user's local timezone without 'Z'
        """

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_instructions},
                    *history,
                    {"role": "user", "content": message}
                ],
                response_format={"type": "json_object"},
                temperature=0.1
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from DeepSeek")
                
            # Parse JSON response (DeepSeek with JSON mode should return clean JSON)
            parsed_data = json.loads(content.strip())
            return ParsedIntent(**parsed_data)
            
        except json.JSONDecodeError as e:
            # Enhanced error logging for debugging
            print(f"JSON parsing error: {e}")
            print(f"Raw content: {content}")
            
            # Fallback to a safe error intent for the retry loop in chat.py
            return ParsedIntent(
                intent="unknown", 
                response="I'm having trouble understanding your request. Could you please rephrase it?",
                requires_clarification=True
            )
        except Exception as e:
            print(f"LLM service error: {e}")
            # Fallback to a safe error intent for the retry loop in chat.py
            return ParsedIntent(
                intent="unknown", 
                response="I'm experiencing technical difficulties. Please try again.",
                requires_clarification=True
            )
    
    async def generate_helpful_response(self, message: str, user_name: str, user_email: str) -> str:
        """Generate helpful AI response for general queries."""
        try:
            system_prompt = f"""You are ChronosAI, a friendly and intelligent meeting assistant helping {user_name} ({user_email}). 
            You have full access to their Google Calendar and can help with scheduling, rescheduling, and managing meetings.
            Be conversational, helpful, and proactive. If you can help with scheduling, offer specific suggestions."""
            
            response = await self.client.chat.completions.create(
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