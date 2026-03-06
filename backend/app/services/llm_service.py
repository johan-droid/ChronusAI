from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, List

from openai import AsyncOpenAI

from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self) -> None:
        self._client = AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
        )

    @staticmethod
    def _system_prompt(user_timezone: str) -> str:
        current_utc_iso = datetime.now(timezone.utc).isoformat()
        return (
            "You are ChronosAI, an advanced AI meeting scheduler with deep calendar intelligence. "
            f"Current UTC datetime: {current_utc_iso}\n"
            f"User's timezone: {user_timezone}\n\n"
            "🎯 MISSION: Parse natural language into precise meeting actions\n\n"
            "🧠 INTELLIGENCE RULES:\n"
            '• Resolve ALL relative dates ("tomorrow", "next Friday", "in 2 hours") to absolute ISO dates\n'
            "• Smart time inference: 'lunch meeting' = 12:00 PM, 'morning sync' = 9:00 AM\n"
            "• Auto-detect meeting types: 'standup' = 15min, 'review' = 60min, 'sync' = 30min\n"
            "• Extract attendees from context: 'with John' or 'john@company.com'\n"
            "• If critical info missing, ask ONE specific question\n"
            "• For conflicts, suggest next available slot automatically\n\n"
            "🚀 AUTOMATION FEATURES:\n"
            "• Auto-schedule to Outlook/Google Calendar\n"
            "• Smart conflict resolution\n"
            "• Timezone-aware scheduling\n"
            "• Meeting type recognition\n\n"
            "RESPOND WITH VALID JSON ONLY in this exact format:\n"
            '{"intent": "schedule|reschedule|cancel|check_availability|unknown", "title": "string", "description": "string", "start_time": "ISO_datetime", "end_time": "ISO_datetime", "attendees": ["email1", "email2"], "response": "user_friendly_message"}'
        )

    @staticmethod
    def _chat_system_prompt(user_name: str) -> str:
        return (
            f"You are ChronosAI, a friendly and intelligent meeting assistant helping {user_name}. "
            "You specialize in calendar management, scheduling, and productivity. "
            "Be conversational, helpful, and concise. If the user asks about scheduling, "
            "guide them to use specific commands like 'schedule a meeting' or 'check my availability'."
        )

    async def parse_intent(self, message: str, user_timezone: str, context: List[dict[str, Any]]) -> ParsedIntent:
        """Parse user message into structured meeting intent using DeepSeek AI."""
        try:
            messages = [
                {"role": "system", "content": self._system_prompt(user_timezone)},
            ]
            
            # Add context (last 4 messages)
            for item in context[-4:]:
                role = item.get("role")
                content = item.get("content", "")
                if role in ["user", "assistant"]:
                    messages.append({"role": role, "content": content})
            
            messages.append({"role": "user", "content": message})
            
            response = await self._client.chat.completions.create(
                model=settings.deepseek_model,
                messages=messages,
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
    
    async def generate_helpful_response(self, message: str, user_name: str) -> str:
        """Generate helpful AI response for general queries."""
        try:
            response = await self._client.chat.completions.create(
                model=settings.deepseek_model,
                messages=[
                    {"role": "system", "content": self._chat_system_prompt(user_name)},
                    {"role": "user", "content": message}
                ],
                temperature=0.7,
                max_tokens=500,
            )
            
            return response.choices[0].message.content or "I'm here to help with your calendar and scheduling needs!"
        except Exception:
            return "I'm here to help with your calendar and scheduling needs. Try asking me to 'schedule a meeting' or 'check my availability'!"


llm_service = LLMService()