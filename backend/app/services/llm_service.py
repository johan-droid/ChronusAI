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
            temperature=0,
        ).with_structured_output(ParsedIntent)

    @staticmethod
    def _system_prompt(user_timezone: str) -> str:
        current_utc_iso = datetime.now(timezone.utc).isoformat()
        return (
            "You are ChronosAI, an intelligent meeting scheduling assistant powered by advanced AI. "
            f"Current UTC datetime: {current_utc_iso}\n"
            f"User's timezone: {user_timezone}\n\n"
            "Your mission: Extract meeting details from natural language and provide structured output.\n\n"
            "Core Rules:\n"
            '1. Resolve ALL relative dates ("tomorrow", "next Friday", "EOD") to absolute ISO 8601 dates.\n'
            "2. If critical info is missing (date/time for CREATE_MEETING), set clarification_needed with a friendly question.\n"
            "3. For CANCEL/UPDATE intents, identify meetings by title or date reference.\n"
            "4. Never invent attendee emails - only use explicitly provided ones.\n"
            "5. Default duration: 30 minutes if unspecified.\n"
            "6. Be conversational, helpful, and precise.\n"
        )

    @staticmethod
    def _to_messages(context: List[dict[str, Any]]) -> List[BaseMessage]:
        msgs: List[BaseMessage] = []
        for item in context[-6:]:
            role = item.get("role")
            content = item.get("content", "")
            if role == "assistant":
                msgs.append(AIMessage(content=content))
            elif role == "user":
                msgs.append(HumanMessage(content=content))
        return msgs

    async def parse_intent(self, message: str, user_timezone: str, context: List[dict[str, Any]]) -> ParsedIntent:
        chain_messages: List[BaseMessage] = [SystemMessage(content=self._system_prompt(user_timezone))]
        chain_messages.extend(self._to_messages(context))
        chain_messages.append(HumanMessage(content=message))
        result = await self._llm.ainvoke(chain_messages)
        return ParsedIntent(**result) if isinstance(result, dict) else result


llm_service = LLMService()
