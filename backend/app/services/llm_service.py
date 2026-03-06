from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self) -> None:
        self._llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.1,
        ).with_structured_output(ParsedIntent)
        
        # General chat LLM for non-scheduling queries
        self._chat_llm = ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.7,
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
            "• Meeting type recognition\n"
        )

    @staticmethod
    def _chat_system_prompt(user_name: str) -> str:
        return (
            f"You are ChronosAI, a friendly and intelligent meeting assistant helping {user_name}. "
            "You specialize in calendar management, scheduling, and productivity. "
            "Be conversational, helpful, and concise. If the user asks about scheduling, "
            "guide them to use specific commands like 'schedule a meeting' or 'check my availability'."
        )

    @staticmethod
    def _to_messages(context: List[dict[str, Any]]) -> List[BaseMessage]:
        msgs: List[BaseMessage] = []
        for item in context[-8:]:
            role = item.get("role")
            content = item.get("content", "")
            if role == "assistant":
                msgs.append(AIMessage(content=content))
            elif role == "user":
                msgs.append(HumanMessage(content=content))
        return msgs

    async def parse_intent(self, message: str, user_timezone: str, context: List[dict[str, Any]]) -> ParsedIntent:
        """Parse user message into structured meeting intent using Gemini AI."""
        chain_messages: List[BaseMessage] = [SystemMessage(content=self._system_prompt(user_timezone))]
        chain_messages.extend(self._to_messages(context))
        chain_messages.append(HumanMessage(content=message))
        
        result = await self._llm.ainvoke(chain_messages)
        return ParsedIntent(**result) if isinstance(result, dict) else result
    
    async def generate_helpful_response(self, message: str, user_name: str) -> str:
        """Generate helpful AI response for general queries."""
        try:
            chain_messages = [
                SystemMessage(content=self._chat_system_prompt(user_name)),
                HumanMessage(content=message)
            ]
            
            result = await self._chat_llm.ainvoke(chain_messages)
            return result.content if hasattr(result, 'content') else str(result)
        except Exception:
            return "I'm here to help with your calendar and scheduling needs. Try asking me to 'schedule a meeting' or 'check my availability'!"


llm_service = LLMService()
