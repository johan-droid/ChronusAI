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

    @staticmethod
    def _system_prompt(user_timezone: str, user_email: str, user_name: str) -> str:
        now_utc = datetime.now(timezone.utc)
        current_utc_iso = now_utc.isoformat()
        current_day = now_utc.strftime("%A, %B %d, %Y")
        
        return (
            f"You are ChronosAI, an expert AI meeting scheduler. Output ONLY valid JSON, no markdown formatting.\n"
            f"Current UTC Date & Time: {current_utc_iso}\n"
            f"Current Day of Week: {current_day}\n"
            f"User timezone: {user_timezone}\n"
            f"User email: {user_email}\n"
            f"User name: {user_name}\n\n"
            "CRITICAL RULES:\n"
            "1. EMAIL VALIDATION: Attendees MUST be valid email addresses (e.g., john@example.com). If user provides names like 'John', either:\n"
            "   - Ask for their email address, OR\n"
            "   - If you know the email from context, use it.\n"
            "   NEVER pass names directly to the API.\n"
            "2. TIMEZONE HANDLING: Output ALL datetimes in the USER'S LOCAL TIMEZONE ({user_timezone}) using ISO format WITHOUT timezone (e.g., 2026-03-10T14:00:00).\n"
            "   DO NOT add 'Z' or timezone offsets. Python will handle UTC conversion.\n"
            "3. If the user says 'tomorrow' or 'next week', calculate the exact date based on the Current Day of Week provided above.\n"
            "4. EVENT TARGETING: For cancel/reschedule operations, use the exact 'event_id' from the provided events list.\n"
            "   If no event_id is available, use the exact title. NEVER use fuzzy matching.\n"
            "5. If no specific attendees are mentioned, return an empty array: [] for attendees.\n"
            "\nINTENTS: schedule | reschedule | cancel | check_availability | find_time | list_meetings | suggest_times | unknown\n"
            "MEETING_PLATFORM: zoom | meet | teams | none\n\n"
            "EXAMPLES:\n"
            "'Schedule a meeting for tomorrow at 2pm' -> \n"
            '{"intent":"schedule", "title":"Meeting", "start_time":"2026-03-10T14:00:00", "end_time":"2026-03-10T14:30:00", "attendees":[], "response":"I\'ll schedule that for you. Do you want to add anyone else?"}\n'
            "'Cancel my sync with John' -> \n"
            '{"intent":"cancel", "event_id":"abc123", "title":"sync", "attendees":["john@example.com"], "response":"I\'ll cancel your sync with John."}\n'
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

    async def parse_intent(self, message: str, user_timezone: str, user_email: str, user_name: str, context: List[Dict[str, Any]], upcoming_events_context: str = "") -> ParsedIntent:
        """Parse user message into structured meeting intent using DeepSeek AI."""
        try:
            # Build enhanced system prompt with events context
            system_prompt = self._system_prompt(user_timezone, user_email, user_name)
            if upcoming_events_context:
                system_prompt += f"\n\nUPCOMING EVENTS (for reference):\n{upcoming_events_context}\n"
            
            messages: List[Dict[str, str]] = [
                {"role": "system", "content": system_prompt},
            ]
            
            # Add context (last 4 messages)
            context_slice = context[-4:]  # pyre-ignore[6]
            for item in context_slice:
                role = item.get("role")
                content_ctx = item.get("content", "")
                if role in ["user", "assistant"]:
                    messages.append({"role": str(role), "content": str(content_ctx)})
            
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
            # Strip markdown code blocks if present
            content = content.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                content = "\n".join(
                    line for line in lines
                    if not line.strip().startswith("```")
                )
            content = content.strip()
            # Parse JSON response robustly
            try:
                # Use regex to find the JSON object, handling markdown and think blocks
                import re
                match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                
                if match:
                    json_str = match.group(1)
                elif "{" in content and "}" in content:
                    idx_start = content.find("{")
                    idx_end = content.rfind("}") + 1
                    json_str = content[idx_start:idx_end]  # pyre-ignore[6]
                else:
                    json_str = content

                parsed_data = json.loads(json_str)
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