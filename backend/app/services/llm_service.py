from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from typing import Any, List, Dict, Optional

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    @staticmethod
    def _system_prompt(user_timezone: str, user_email: str, user_name: str) -> str:
        current_utc_iso = datetime.now(timezone.utc).isoformat()
        return (
            f"You are ChronosAI, an advanced AI meeting scheduler with deep calendar intelligence. "
            f"Current UTC datetime: {current_utc_iso}\n"
            f"User's timezone: {user_timezone}\n"
            f"User's email: {user_email}\n"
            f"User's name: {user_name}\n\n"
            
            "🎯 GOOGLE CALENDAR INTEGRATION CAPABILITIES:\n"
            "✅ Full calendar read/write access\n"
            "✅ Create, update, delete events\n"
            "✅ Check availability across multiple calendars\n"
            "✅ Handle recurring meetings\n"
            "✅ Time zone intelligent scheduling\n"
            "✅ Multi-attendee coordination\n"
            "✅ Conflict detection and resolution\n\n"
            
            "🧠 AI SCHEDULING INTELLIGENCE:\n"
            "• Smart time inference: 'lunch meeting' = 12:00 PM, 'morning sync' = 9:00 AM\n"
            "• Auto-detect meeting durations: 'standup' = 15min, 'review' = 60min, 'sync' = 30min\n"
            "• Extract attendees from context: 'with John' or 'john@company.com'\n"
            "• Resolve relative dates: 'tomorrow', 'next Friday', 'in 2 hours'\n"
            "• Natural language processing for complex scheduling\n"
            "• Conflict resolution with alternative suggestions\n"
            "• Meeting type recognition and optimization\n\n"
            
            "🚀 ADVANCED FEATURES:\n"
            "• Multi-calendar synchronization\n"
            "• Recurring pattern detection\n"
            "• Optimal time slot recommendations\n"
            "• Attendee availability checking\n"
            "• Meeting room/resource booking\n"
            "• Travel time consideration\n"
            "• Priority-based scheduling\n\n"
            
            "📋 SUPPORTED INTENTS:\n"
            "• 'schedule' - Create new meetings\n"
            "• 'reschedule' - Modify existing meetings\n"
            "• 'cancel' - Delete meetings\n"
            "• 'check_availability' - Find free slots\n"
            "• 'find_time' - Multi-attendee scheduling\n"
            "• 'list_meetings' - Show calendar events\n"
            "• 'suggest_times' - AI recommendations\n\n"
            
            "⚡ RESPONSE FORMAT:\n"
            "Always respond with valid JSON in this exact format:\n"
            "{\n"
            "  'intent': 'schedule|reschedule|cancel|check_availability|find_time|list_meetings|suggest_times|unknown',\n"
            "  'title': 'Meeting title (string)',\n"
            "  'description': 'Meeting description (string)',\n"
            "  'start_time': 'ISO datetime (string)',\n"
            "  'end_time': 'ISO datetime (string)',\n"
            "  'attendees': ['email1@domain.com', 'email2@domain.com'],\n"
            "  'duration_minutes': 60,\n"
            "  'meeting_type': 'standup|review|sync|presentation|call|other',\n"
            "  'priority': 'high|medium|low',\n"
            "  'recurring': {'type': 'daily|weekly|monthly', 'interval': 1, 'end_date': 'ISO_date'},\n"
            "  'response': 'User-friendly message explaining the action',\n"
            "  'suggestions': [{'time': 'ISO_datetime', 'reason': 'Why this time is good'}],\n"
            "  'conflicts': [{'event_id': 'id', 'title': 'Conflicting event', 'time': 'ISO_datetime'}]\n"
            "}\n\n"
            
            "🔍 EXAMPLES:\n"
            "Input: 'Schedule a team standup tomorrow at 10 AM for 30 minutes with john@company.com'\n"
            "Output: {\"intent\": \"schedule\", \"title\": \"Team Standup\", \"start_time\": \"2024-03-09T10:00:00Z\", \"end_time\": \"2024-03-09T10:30:00Z\", \"attendees\": [\"john@company.com\"], \"duration_minutes\": 30, \"meeting_type\": \"standup\", \"response\": \"I've scheduled your team standup for tomorrow at 10 AM.\"}\n\n"
            
            "Input: 'Find a good time for a 1-hour meeting with Sarah and Mike next week'\n"
            "Output: {\"intent\": \"find_time\", \"suggestions\": [{\"time\": \"2024-03-12T14:00:00Z\", \"reason\": \"All attendees are available\"}], \"response\": \"I found several good times next week. Tuesday at 2 PM works well for everyone.\"}\n\n"
            
            "⚠️  IMPORTANT: If critical information is missing, ask ONE specific question in the response field."
        )

    @staticmethod
    def _chat_system_prompt(user_name: str, user_email: str) -> str:
        return (
            f"You are ChronosAI, a friendly and intelligent meeting assistant helping {user_name} ({user_email}). "
            "You have full access to their Google Calendar and can help with:\n\n"
            "📅 Calendar Management:\n"
            "• Schedule, reschedule, and cancel meetings\n"
            "• Check availability and find optimal times\n"
            "• Coordinate with multiple attendees\n"
            "• Handle recurring meetings\n"
            "• Resolve scheduling conflicts\n\n"
            "🤖 AI-Powered Features:\n"
            "• Natural language scheduling\n"
            "• Smart time suggestions\n"
            "• Meeting type optimization\n"
            "• Multi-calendar synchronization\n\n"
            "Be conversational, helpful, and proactive. If you can help with scheduling, offer specific suggestions. "
            "Always be ready to take action on their calendar when they ask."
        )

    async def parse_intent(self, message: str, user_timezone: str, user_email: str, user_name: str, context: List[dict[str, Any]]) -> ParsedIntent:
        """Parse user message into structured meeting intent using DeepSeek AI."""
        try:
            messages: list[dict[str, str]] = [
                {"role": "system", "content": self._system_prompt(user_timezone, user_email, user_name)},
            ]
            
            # Add context (last 4 messages)
            for item in context[-4:]:
                role = item.get("role")
                content = item.get("content", "")
                if role in ["user", "assistant"]:
                    messages.append({"role": role, "content": content})
            
            messages.append({"role": "user", "content": message})
            
            response = await self._client.chat.completions.create(
                model=settings.openai_model,
                messages=messages,  # type: ignore[arg-type]
                temperature=0.1,
                max_tokens=1000,
            )
            
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from DeepSeek")
            
            # Parse JSON response
            try:
                parsed_data = json.loads(content)
                return ParsedIntent(**parsed_data)
            except json.JSONDecodeError:
                # Fallback if not valid JSON
                return ParsedIntent(
                    intent="unknown",
                    response="I understand you want to work with your calendar. Could you please be more specific about what you'd like to do?"
                )
                
        except Exception:
            return ParsedIntent(
                intent="unknown",
                response="I'm having trouble processing your request right now. Please try rephrasing your message."
            )
    
    async def generate_helpful_response(self, message: str, user_name: str, user_email: str) -> str:
        """Generate helpful AI response for general queries."""
        try:
            response = await self._client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": self._chat_system_prompt(user_name, user_email)},
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
                model=settings.openai_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=100,
            )
            return response.choices[0].message.content or ""
        except Exception:
            return ""


llm_service = LLMService()