# pyre-unsafe
"""
LLM Service – Optimized for Gemini API token conservation.

Key optimisations:
1. Compressed system prompts (≈60 % shorter) – fewer input tokens per call.
2. Explicit max_output_tokens on EVERY call (parse_intent: 600, action: 400, helpful: 300).
3. LRU response cache – identical (message, context-hash) pairs served from memory.
4. Conversation history sliding window – only the last N turns are sent.
5. Smart context injection – calendar context only included when intent likely needs it.
6. Single-pass for chat intents – uses parse_intent response directly.
"""
from __future__ import annotations

import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timezone
from typing import Any, Dict, List

import google.genai as genai
from google.genai import types

from app.config import settings
from app.schemas.chat import ParsedIntent

# ---------------------------------------------------------------------------
# Tunables — read from settings (env-overridable), with fallback defaults
# ---------------------------------------------------------------------------
MAX_HISTORY_TURNS: int = getattr(settings, "llm_max_history_turns", 6)
CACHE_MAX_SIZE: int = getattr(settings, "llm_cache_size", 128)
PARSE_INTENT_MAX_TOKENS: int = getattr(settings, "llm_parse_max_tokens", 600)
ACTION_RESP_MAX_TOKENS: int = getattr(settings, "llm_action_max_tokens", 400)
HELPFUL_RESP_MAX_TOKENS: int = getattr(settings, "llm_helpful_max_tokens", 300)
COMPLETION_MAX_TOKENS: int = 100


# ---------------------------------------------------------------------------
# Lightweight LRU cache (avoids duplicate Gemini calls for identical inputs)
# ---------------------------------------------------------------------------
class _LRUCache:
    def __init__(self, maxsize: int = CACHE_MAX_SIZE) -> None:
        self._store: OrderedDict[str, Any] = OrderedDict()
        self._maxsize = maxsize

    @staticmethod
    def _key(parts: list[str]) -> str:
        return hashlib.sha256("|".join(parts).encode()).hexdigest()

    def get(self, parts: list[str]) -> Any | None:
        k = self._key(parts)
        if k in self._store:
            self._store.move_to_end(k)
            return self._store[k]
        return None

    def put(self, parts: list[str], value: Any) -> None:
        k = self._key(parts)
        self._store[k] = value
        self._store.move_to_end(k)
        while len(self._store) > self._maxsize:
            self._store.popitem(last=False)


_intent_cache = _LRUCache()
_response_cache = _LRUCache()


def _truncate_history(history: List[Dict[str, str]], max_turns: int = MAX_HISTORY_TURNS) -> List[Dict[str, str]]:
    """Keep only the most recent *max_turns* messages."""
    return history[-max_turns:] if len(history) > max_turns else history


def _looks_calendar_related(message: str) -> bool:
    """Quick heuristic: does the message likely need calendar context?"""
    msg = message.lower()
    keywords = (
        "schedule", "meeting", "cancel", "reschedule", "availability",
        "free", "busy", "event", "remind", "calendar", "book", "slot",
        "move", "delete", "add", "invite", "attendee", "conflict",
        "tomorrow", "next week", "today", "morning", "afternoon",
        "pm", "am", "o'clock",
    )
    return any(kw in msg for kw in keywords)


class LLMService:
    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = getattr(settings, "llm_model_name", "gemini-3-flash-preview")

    # ------------------------------------------------------------------
    # 1. parse_intent  (compressed prompt, capped tokens, cached, windowed)
    # ------------------------------------------------------------------
    async def parse_intent(
        self,
        message: str,
        user_tz: str,
        user_email: str,
        user_name: str,
        history: List[Dict[str, str]],
        upcoming_events_context: str,
    ) -> ParsedIntent:
        # --- cache check ---
        cache_parts = [message.strip().lower(), upcoming_events_context[:200]]
        cached = _intent_cache.get(cache_parts)
        if cached is not None:
            return cached

        # --- conditionally include calendar state (saves ~40% tokens on greetings) ---
        cal_block = ""
        if _looks_calendar_related(message) and upcoming_events_context and upcoming_events_context != "No upcoming events in Google Calendar.":
            cal_block = f"\nCALENDAR:\n{upcoming_events_context}\n"

        system_instructions = (
            "You are ChronosAI intent parser. Output ONLY valid JSON.\n"
            f"UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} | "
            f"User: {user_name} <{user_email}> tz={user_tz}\n"
            f"{cal_block}"
            "Schema: "
            '{"intent":"schedule|cancel|reschedule|check_availability|list_meetings|chat|find_time|suggest_times|unknown",'
            '"title":str|null,"start_time":"ISO8601 local"|null,"end_time":"ISO8601 local"|null,'
            '"event_id":"from CALENDAR"|null,"attendees":["emails"],'
            '"response":"brief text","requires_clarification":bool,'
            '"meeting_type":"meeting|call|review|presentation"|null,"description":str|null}\n'
            "Rules: cancel/reschedule→exact event_id from CALENDAR. "
            "Times in user tz (no Z). Missing date→null times, ask in response. "
            "Greetings→chat. Valid emails only. Relative dates from UTC now. "
            "Self-Correction: fix error mentioned in history."
        )

        # --- sliding window for history ---
        trimmed = _truncate_history(history, MAX_HISTORY_TURNS)
        contents: list[dict] = []
        for msg in trimmed:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        contents.append({"role": "user", "parts": [{"text": message}]})

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instructions,
                    temperature=0.1,
                    max_output_tokens=PARSE_INTENT_MAX_TOKENS,
                ),
            )

            content = response.text
            if not content:
                raise ValueError("Empty response from Gemini")

            text = content.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            parsed = ParsedIntent(**json.loads(text.strip()))

            _intent_cache.put(cache_parts, parsed)
            return parsed

        except json.JSONDecodeError as e:
            raise ValueError(f"LLM returned invalid JSON: {e}")
        except Exception as e:
            err = str(e).lower()
            if "402" in err or "insufficient balance" in err:
                raise ValueError(f"LLM API error: {e}")
            elif "rate limit" in err or "too many requests" in err:
                raise ValueError(f"LLM rate limit exceeded: {e}")
            elif "authentication" in err or "unauthorized" in err:
                raise ValueError(f"LLM authentication failed: {e}")
            raise ValueError(f"LLM service error: {e}")

    # ------------------------------------------------------------------
    # 2. generate_helpful_response  (compressed, cached)
    # ------------------------------------------------------------------
    async def generate_helpful_response(
        self,
        message: str,
        user_name: str,
        user_email: str,
    ) -> str:
        cached = _response_cache.get(["helpful", message.strip().lower()])
        if cached is not None:
            return cached

        system_prompt = (
            f"You are ChronosAI, a concise meeting assistant for {user_name}. "
            "Answer briefly (1-3 sentences). Mention scheduling only if relevant."
        )
        contents = [{"role": "user", "parts": [{"text": message}]}]
        try:
            resp = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    max_output_tokens=HELPFUL_RESP_MAX_TOKENS,
                ),
            )
            result = resp.text or "I'm here to help with your calendar. What can I do for you today?"
            _response_cache.put(["helpful", message.strip().lower()], result)
            return result
        except Exception:
            return "I'm here to help with your calendar. What can I do for you today?"

    # ------------------------------------------------------------------
    # 3. generate_action_response  (compressed prompt, token-capped)
    # ------------------------------------------------------------------
    async def generate_action_response(
        self,
        user_message: str,
        intent_data: Any,
        action_result: dict,
        history: List[Dict[str, Any]],
    ) -> str:
        system_prompt = (
            "You are ChronosAI. Explain the calendar action result concisely (2-4 sentences).\n"
            "Confirm title/time/attendees on success; suggest alternatives on conflict; "
            "use user local time; don't fabricate info.\n"
            "Icons: ✅ success, ⚠️ conflict, ❌ failure."
        )

        execution_context = {
            "user_input": user_message,
            "intent": intent_data.dict() if hasattr(intent_data, "dict") else str(intent_data),
            "outcome": action_result,
        }

        # Only last 2 history msgs for context
        recent = _truncate_history(history, 2)
        contents: list[dict] = []
        for msg in recent:
            role = "model" if msg.get("role") == "assistant" else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        contents.append(
            {"role": "user", "parts": [{"text": f"Action result: {json.dumps(execution_context, default=str)}"}]}
        )

        try:
            resp = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    max_output_tokens=ACTION_RESP_MAX_TOKENS,
                ),
            )
            return resp.text or "Action completed."
        except Exception:
            return "Action completed."

    # ------------------------------------------------------------------
    # 4. generate_completion  (unchanged, token-capped)
    # ------------------------------------------------------------------
    async def generate_completion(self, prompt: str) -> str:
        try:
            contents = [{"role": "user", "parts": [{"text": prompt}]}]
            resp = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=COMPLETION_MAX_TOKENS,
                ),
            )
            return resp.text or ""
        except Exception:
            return ""


llm_service = LLMService()