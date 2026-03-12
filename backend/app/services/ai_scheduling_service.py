from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, List, Dict, Tuple

import google.genai as genai
from google.genai import types
from app.config import settings

# Token caps – much lower than before to conserve quota
_PATTERN_MAX_TOKENS = 800
_SUGGEST_MAX_TOKENS = 600
_CONFLICT_MAX_TOKENS = 600
_OPTIMIZE_MAX_TOKENS = 800

# Compressed scheduling prompt – ~75 % shorter than original
_SCHEDULING_PROMPT = (
    "You are ChronosAI scheduling AI. Respond ONLY with valid JSON.\n"
    "Capabilities: pattern analysis, conflict resolution, optimal time suggestion, focus-time preservation.\n"
    "Meeting type norms: standup 15m daily, sync 30m 2-3x/wk, review 60m weekly, client 45-60m, 1:1 30m weekly.\n"
    "JSON keys (include relevant ones): analysis, recommendations[{type,description,impact}], "
    "optimal_times[{time,reason,confidence}], conflict_resolution{strategy,suggestion}, "
    "productivity_tips[], meeting_insights{total_meetings,avg_duration,focus_time_available}.\n"
)


class AISchedulingService:
    """AI scheduling service – optimised for low token usage."""

    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.llm_model_name

    # ---- helpers ----
    async def _call(self, user_content: str, max_tokens: int, temperature: float = 0.3) -> Dict[str, Any]:
        """Shared Gemini call with compressed system prompt."""
        contents = [{"role": "user", "parts": [{"text": user_content}]}]
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=_SCHEDULING_PROMPT,
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                ),
            )
            text = (response.text or "").strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return {"analysis": response.text if response else "Parse error", "recommendations": []}
        except Exception as e:
            return {"analysis": f"Error: {e}", "recommendations": []}

    # ---- public API (same signatures, lower token cost) ----
    async def analyze_calendar_patterns(
        self,
        events: List[Dict[str, Any]],
        user_timezone: str,
        date_range: Tuple[datetime, datetime],
    ) -> Dict[str, Any]:
        summary = self._prepare_calendar_summary(events, date_range)
        prompt = (
            f"Analyze calendar {date_range[0].date()} to {date_range[1].date()} tz={user_timezone}.\n"
            f"{json.dumps(summary)}\n"
            "Return: patterns, optimal slots, productivity tips, conflicts, focus time."
        )
        return await self._call(prompt, _PATTERN_MAX_TOKENS)

    async def suggest_optimal_meeting_times(
        self,
        duration_minutes: int,
        attendees: List[str],
        meeting_type: str,
        user_timezone: str,
        preferred_days: List[str] = None,
        time_constraints: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        prompt = (
            f"Suggest 3 optimal times: {duration_minutes}min {meeting_type}, "
            f"attendees={','.join(attendees[:5])}, tz={user_timezone}, "
            f"days={preferred_days or 'any'}, now={datetime.now(timezone.utc).isoformat()}, "
            f"constraints={json.dumps(time_constraints or {})}"
        )
        return await self._call(prompt, _SUGGEST_MAX_TOKENS, temperature=0.4)

    async def resolve_conflicts_intelligently(
        self,
        conflicting_events: List[Dict[str, Any]],
        new_event: Dict[str, Any],
        user_preferences: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        prompt = (
            f"Resolve conflict: new={json.dumps(new_event)}, "
            f"conflicts={json.dumps(conflicting_events)}, "
            f"prefs={json.dumps(user_preferences or {})}. "
            "Suggest strategy and alternative times."
        )
        return await self._call(prompt, _CONFLICT_MAX_TOKENS)

    async def optimize_meeting_schedule(
        self,
        events: List[Dict[str, Any]],
        goals: List[str],
        constraints: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        prompt = (
            f"Optimize schedule: events={json.dumps(events[:15])}, "
            f"goals={','.join(goals)}, constraints={json.dumps(constraints or {})}. "
            "Return frequency/duration adjustments, focus time, energy tips."
        )
        return await self._call(prompt, _OPTIMIZE_MAX_TOKENS)

    def _prepare_calendar_summary(
        self, 
        events: List[Dict[str, Any]], 
        date_range: Tuple[datetime, datetime]
    ) -> Dict[str, Any]:
        """Prepare calendar data for AI analysis."""
        summary = {
            "total_events": len(events),
            "date_range": {
                "start": date_range[0].isoformat(),
                "end": date_range[1].isoformat()
            },
            "events_by_type": {},
            "events_by_duration": {},
            "events_by_hour": {},
            "busiest_days": {},
            "meeting_patterns": []
        }
        
        for event in events:
            # Extract event details
            title = event.get("title", "Unknown")
            start = event.get("start_time")
            end = event.get("end_time")
            
            if start and end:
                # Calculate duration
                start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                duration = (end_dt - start_dt).total_seconds() / 60  # minutes
                
                # Categorize by type
                event_type = self._classify_meeting_type(title)
                if event_type not in summary["events_by_type"]:
                    summary["events_by_type"][event_type] = 0
                summary["events_by_type"][event_type] += 1
                
                # Categorize by duration
                duration_category = self._categorize_duration(duration)
                if duration_category not in summary["events_by_duration"]:
                    summary["events_by_duration"][duration_category] = 0
                summary["events_by_duration"][duration_category] += 1
                
                # Track by hour
                hour = start_dt.hour
                if hour not in summary["events_by_hour"]:
                    summary["events_by_hour"][hour] = 0
                summary["events_by_hour"][hour] += 1
                
                # Track by day
                day = start_dt.strftime("%A")
                if day not in summary["busiest_days"]:
                    summary["busiest_days"][day] = 0
                summary["busiest_days"][day] += 1
        
        return summary

    def _classify_meeting_type(self, title: str) -> str:
        """Classify meeting type based on title."""
        title_lower = title.lower()
        
        if any(keyword in title_lower for keyword in ["standup", "daily", "morning sync"]):
            return "standup"
        elif any(keyword in title_lower for keyword in ["review", "retro", "demo"]):
            return "review"
        elif any(keyword in title_lower for keyword in ["sync", "check-in", "catch-up"]):
            return "sync"
        elif any(keyword in title_lower for keyword in ["planning", "strategy", "roadmap"]):
            return "planning"
        elif any(keyword in title_lower for keyword in ["client", "customer", "sales"]):
            return "client"
        elif any(keyword in title_lower for keyword in ["1-on-1", "1:1", "one-on-one"]):
            return "1on1"
        else:
            return "other"

    def _categorize_duration(self, duration_minutes: float) -> str:
        """Categorize meeting duration."""
        if duration_minutes <= 15:
            return "quick"
        elif duration_minutes <= 30:
            return "short"
        elif duration_minutes <= 60:
            return "standard"
        elif duration_minutes <= 90:
            return "long"
        else:
            return "extended"


ai_scheduling_service = AISchedulingService()
