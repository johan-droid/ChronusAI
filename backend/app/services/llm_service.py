from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self) -> None:
        self._llm = ChatOpenAI(
            model=settings.openai_model,
            api_key=settings.openai_api_key.get_secret_value(),
            temperature=0,
        ).with_structured_output(ParsedIntent)

    @staticmethod
    def _system_prompt(user_timezone: str) -> str:
        current_utc_iso = datetime.now(timezone.utc).isoformat()
        return (
            "You are a meeting scheduling assistant. "
            f"The current UTC datetime is {current_utc_iso}.\n"
            f"The user's local timezone is {user_timezone}.\n\n"
            "Extract meeting details from the user's message and return a structured JSON matching "
            "the ParsedIntent schema. Rules:\n"
            '- Resolve ALL relative dates ("tomorrow", "next Friday", "EOD") to absolute ISO 8601 dates '
            "using the current UTC time and the user's timezone.\n"
            "- If critical info is missing (date, time for CREATE_MEETING), set clarification_needed "
            "to a natural follow-up question instead of guessing.\n"
            "- For CANCEL/UPDATE intents, identify the meeting by title or date reference.\n"
            "- Never invent attendee email addresses. Only use what the user explicitly provides.\n"
            "- Default duration to 30 minutes if unspecified.\n"
        )

    @staticmethod
    def _to_messages(context: List[dict[str, Any]]) -> List[Any]:
        msgs: List[Any] = []
        for item in context[-6:]:
            role = item.get("role")
            content = item.get("content", "")
            if role == "assistant":
                msgs.append(AIMessage(content=content))
            elif role == "user":
                msgs.append(HumanMessage(content))
        return msgs

    async def parse_intent(self, message: str, user_timezone: str, context: List[dict[str, Any]]) -> ParsedIntent:
        chain_messages = [SystemMessage(content=self._system_prompt(user_timezone))]
        chain_messages.extend(self._to_messages(context))
        chain_messages.append(HumanMessage(content=message))
        result = await self._llm.ainvoke(chain_messages)
        return ParsedIntent(**result) if isinstance(result, dict) else result


llm_service = LLMService()
