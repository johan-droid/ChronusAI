from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, List, Dict, Tuple

import google.genai as genai
from google.genai.models import Models
from app.config import settings


class AISchedulingService:
    """Advanced AI-powered service with Google Calendar integration."""
    
    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.llm_model_name

    @staticmethod
    def _scheduling_intelligence_prompt() -> str:
        """Comprehensive prompt for AI scheduling intelligence (Zoom/Google Meet/Teams aware)."""
        return (
            "You are ChronosAI, an expert scheduling AI with deep understanding of meeting patterns and optimization. "
            "You support Google Calendar, Google Meet, Microsoft Graph/Outlook, Teams online meetings, and Zoom. "
            "Provide recommendations that respect platform limits: Zoom 15-720 min; Meet/Teams follow calendar event duration.\n\n"
            "SCHEDULING INTELLIGENCE CAPABILITIES:\n"
            "• Analyze meeting patterns and productivity\n"
            "• Optimize meeting types and durations\n"
            "• Suggest best times based on historical data\n"
            "• Detect and resolve scheduling conflicts\n"
            "• Recommend meeting frequency adjustments\n"
            "• Identify time-wasting meetings\n"
            "• Suggest focus time blocks\n"
            "• Optimize multi-attendee coordination\n\n"
            
            "📊 MEETING TYPE OPTIMIZATION:\n"
            "• Standup meetings: 15 minutes, daily morning\n"
            "• Team sync: 30 minutes, 2-3 times per week\n"
            "• Project reviews: 60 minutes, weekly/bi-weekly\n"
            "• Client calls: 45-60 minutes, as needed\n"
            "• Brainstorming: 60-90 minutes, when energy is high\n"
            "• 1-on-1s: 30 minutes, weekly\n"
            "• All-hands: 60 minutes, monthly\n\n"
            
            "⏰ TIME ZONE INTELLIGENCE:\n"
            "• Automatically detect attendee time zones\n"
            "• Suggest meeting times that work across zones\n"
            "• Account for daylight saving time changes\n"
            "• Consider cultural meeting norms\n\n"
            
            "🎯 PRIORITY-BASED SCHEDULING:\n"
            "• High priority: Best time slots, no conflicts\n"
            "• Medium priority: Flexible timing, minor conflicts acceptable\n"
            "• Low priority: Can be rescheduled easily\n\n"
            
            "🔄 RECURRING MEETING PATTERNS:\n"
            "• Daily standups: Same time each day\n"
            "• Weekly reviews: Consistent day/time\n"
            "• Monthly syncs: First/last week of month\n"
            "• Quarterly planning: Start of quarter\n\n"
            
            "⚡ RESPONSE FORMAT:\n"
            "Respond with JSON containing:\n"
            "{\n"
            "  'analysis': 'Meeting pattern analysis',\n"
            "  'recommendations': [{'type': 'schedule_optimization', 'description': 'What to improve', 'impact': 'high|medium|low'}],\n"
            "  'optimal_times': [{'time': 'ISO_datetime', 'reason': 'Why this time is optimal', 'confidence': 0.95}],\n"
            "  'conflict_resolution': {'strategy': 'move|shorten|cancel', 'suggestion': 'How to resolve'},\n"
            "  'productivity_tips': ['Tip 1', 'Tip 2'],\n"
            "  'meeting_insights': {'total_meetings': 25, 'avg_duration': 45, 'focus_time_available': 12}\n"
            "}"
        )

    async def analyze_calendar_patterns(
        self, 
        events: List[Dict[str, Any]], 
        user_timezone: str,
        date_range: Tuple[datetime, datetime]
    ) -> Dict[str, Any]:
        """Analyze calendar patterns and provide optimization recommendations."""
        try:
            # Prepare calendar data for analysis
            calendar_summary = self._prepare_calendar_summary(events, date_range)
            
            messages = [
                {"role": "system", "content": self._scheduling_intelligence_prompt()},
                {
                    "role": "user", 
                    "content": f"""
                    Analyze this calendar data for {date_range[0].date()} to {date_range[1].date()} in {user_timezone} timezone:
                    
                    {json.dumps(calendar_summary, indent=2)}
                    
                    Provide insights on:
                    1. Meeting patterns and frequency
                    2. Optimal time slots for different meeting types
                    3. Productivity recommendations
                    4. Conflict resolution strategies
                    5. Focus time availability
                    """
                }
            ]
            
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=messages,
                config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1500
                )
            )
            
            content = response.text
            if content:
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"analysis": content, "recommendations": []}
            
            return {"analysis": "Unable to analyze calendar patterns", "recommendations": []}
            
        except Exception as e:
            return {"analysis": f"Error analyzing patterns: {str(e)}", "recommendations": []}

    async def suggest_optimal_meeting_times(
        self,
        duration_minutes: int,
        attendees: List[str],
        meeting_type: str,
        user_timezone: str,
        preferred_days: List[str] = None,
        time_constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Suggest optimal meeting times based on AI analysis."""
        try:
            current_time = datetime.now(timezone.utc)
            
            messages = [
                {"role": "system", "content": self._scheduling_intelligence_prompt()},
                {
                    "role": "user",
                    "content": f"""
                    Suggest optimal meeting times for:
                    - Duration: {duration_minutes} minutes
                    - Meeting type: {meeting_type}
                    - Attendees: {', '.join(attendees)}
                    - Timezone: {user_timezone}
                    - Preferred days: {preferred_days or 'Any'}
                    - Current time: {current_time.isoformat()}
                    - Constraints: {time_constraints or 'None'}
                    
                    Consider:
                    1. Best times for this meeting type
                    2. Attendee availability patterns
                    3. Energy levels and productivity
                    4. Time zone considerations
                    5. Recurring pattern optimization
                    
                    Provide 3-5 specific time suggestions with reasoning.
                    """
                }
            ]
            
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=messages,
                config=genai.GenerationConfig(
                    temperature=0.4,
                    max_output_tokens=1000
                )
            )
            
            content = response.text
            if content:
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"suggestions": [], "analysis": content}
            
            return {"suggestions": [], "analysis": "Unable to generate suggestions"}
            
        except Exception as e:
            return {"suggestions": [], "analysis": f"Error generating suggestions: {str(e)}"}

    async def resolve_conflicts_intelligently(
        self,
        conflicting_events: List[Dict[str, Any]],
        new_event: Dict[str, Any],
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """AI-powered conflict resolution with smart suggestions."""
        try:
            messages = [
                {"role": "system", "content": self._scheduling_intelligence_prompt()},
                {
                    "role": "user",
                    "content": f"""
                    Resolve scheduling conflicts intelligently:
                    
                    New Event: {json.dumps(new_event, indent=2)}
                    Conflicting Events: {json.dumps(conflicting_events, indent=2)}
                    User Preferences: {json.dumps(user_preferences or {}, indent=2)}
                    
                    Analyze and provide:
                    1. Conflict severity assessment
                    2. Resolution strategies (move, shorten, cancel)
                    3. Specific alternative time suggestions
                    4. Impact on productivity and priorities
                    5. Recommended action with reasoning
                    
                    Consider meeting importance, attendee availability, and optimal scheduling patterns.
                    """
                }
            ]
            
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=messages,
                config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1200
                )
            )
            
            content = response.text
            if content:
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"resolution": content, "alternatives": []}
            
            return {"resolution": "Unable to resolve conflicts", "alternatives": []}
            
        except Exception as e:
            return {"resolution": f"Error resolving conflicts: {str(e)}", "alternatives": []}

    async def optimize_meeting_schedule(
        self,
        events: List[Dict[str, Any]],
        goals: List[str],
        constraints: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Optimize entire meeting schedule based on goals and constraints."""
        try:
            messages = [
                {"role": "system", "content": self._scheduling_intelligence_prompt()},
                {
                    "role": "user",
                    "content": f"""
                    Optimize this meeting schedule for better productivity:
                    
                    Current Events: {json.dumps(events, indent=2)}
                    Goals: {', '.join(goals)}
                    Constraints: {json.dumps(constraints or {}, indent=2)}
                    
                    Provide optimization recommendations for:
                    1. Meeting frequency and duration adjustments
                    2. Better time slot allocations
                    3. Focus time preservation
                    4. Energy management throughout the day
                    5. Meeting type improvements
                    
                    Include specific actions to take and expected benefits.
                    """
                }
            ]
            
            response = await self.client.models.generate_content(
                model=self.model_name,
                contents=messages,
                config=genai.GenerationConfig(
                    temperature=0.3,
                    max_output_tokens=1500
                )
            )
            
            content = response.text
            if content:
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"optimizations": [], "analysis": content}
            
            return {"optimizations": [], "analysis": "Unable to optimize schedule"}
            
        except Exception as e:
            return {"optimizations": [], "analysis": f"Error optimizing schedule: {str(e)}"}

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
