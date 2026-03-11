# pyre-unsafe
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import google.genai as genai
from google.genai import types
from app.config import settings
from app.schemas.chat import ParsedIntent


class LLMService:
    def __init__(self):
        # Google Gemini 3 Flash Preview using native SDK
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = getattr(settings, "llm_model_name", "gemini-3-flash-preview")

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
        Optimized for Google Gemini 3 Flash Preview with enhanced GoogleCalendarService integration.
        """
        
        system_instructions = f"""
        You are Intent Parser for ChronosAI. Your ONLY job is to output a json object.
        
        CURRENT CONTEXT:
        - Time (UTC): {datetime.now(timezone.utc).isoformat()}
        - User: {user_name} ({user_email})
        - Timezone: {user_tz}
        
        LIVE CALENDAR STATE (Source of Truth):
        {upcoming_events_context}

        TASK:
        Convert user's message into following json schema:
        {{
            "intent": "schedule" | "cancel" | "reschedule" | "check_availability" | "list_meetings" | "chat" | "find_time" | "suggest_times" | "unknown",
            "title": "string or null",
            "start_time": "ISO 8601 string or null",
            "end_time": "ISO 8601 string or null",
            "event_id": "The exact ID from LIVE CALENDAR STATE if referencing an existing event",
            "attendees": ["list of emails"],
            "response": "Brief acknowledgment or clarification question",
            "requires_clarification": true/false,
            "meeting_type": "meeting|call|review|presentation|null",
            "description": "string or null"
        }}

        STRICT RULES:
        1. ID MATCHING: If user wants to cancel or reschedule, find 'ID' from LIVE CALENDAR STATE that matches their description.
        2. TIMEZONE: All 'start_time' and 'end_time' values must be in user's local timezone format (ISO 8601).
        3. ERROR HANDLING: If you are missing a date for 'schedule', set intent to 'schedule' but keep times null and use 'response' to ask for date.
        4. CHAT: If user is just saying hello or asking general questions, use 'chat' intent.
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
        
        FEW-SHOT EXAMPLES FOR COMPLEX SCENARIOS:
        
        ### EXAMPLE 1: Complex Group Reschedule
        User: "Move 'Project Sync' with Dave and Sarah to Friday at 10 AM. Sarah can't make the current slot."
        
        LIVE CALENDAR STATE:
        - ID: "cal_998877", Title: "Project Sync", Start: "2026-03-12T14:00:00Z", Attendees: ["user@email.com", "dave@corp.com", "sarah@corp.com"]
        
        YOUR OUTPUT:
        {{
            "intent": "reschedule",
            "title": "Project Sync",
            "event_id": "cal_998877",
            "start_time": "2026-03-13T10:00:00",
            "attendees": ["dave@corp.com", "sarah@corp.com"],
            "response": "I'm rescheduling Project Sync for Friday at 10 AM and checking if everyone is free."
        }}
        
        ### EXAMPLE 2: Resolving Ambiguity with Multiple Events
        User: "Cancel my meeting with designers."
        
        LIVE CALENDAR STATE:
        - ID: "id_abc123", Title: "Design Review", Start: "2026-03-11T09:00:00Z"
        - ID: "id_xyz789", Title: "UI/UX Workshop", Start: "2026-03-11T15:00:00Z"
        
        YOUR OUTPUT:
        {{
            "intent": "cancel",
            "event_id": null,
            "response": "You have two meetings with designers tomorrow: 'Design Review' at 9 AM and 'UI/UX Workshop' at 3 PM. Which one should I cancel?"
        }}
        
        ### EXAMPLE 3: Conflict Resolution with Suggestions
        User: "Schedule a team meeting for tomorrow afternoon."
        
        LIVE CALENDAR STATE:
        - ID: "cal_123456", Title: "Team Standup", Start: "2026-03-12T15:00:00Z"
        
        YOUR OUTPUT:
        {{
            "intent": "schedule",
            "start_time": "2026-03-13T16:00:00",
            "response": "That time conflicts with Team Standup. How about 3 PM instead?",
            "requires_clarification": true,
            "suggestions": [
                {{"time": "2026-03-13T16:00:00", "reason": "No conflicts"}}
            ]
        }}
        
        ### EXAMPLE 4: Attendee Management
        User: "Add Maria to Project Sync meeting."
        
        LIVE CALENDAR STATE:
        - ID: "cal_998877", Title: "Project Sync", Start: "2026-03-12T14:00:00Z", Attendees: ["user@email.com", "dave@corp.com", "sarah@corp.com"]
        
        YOUR OUTPUT:
        {{
            "intent": "reschedule",
            "event_id": "cal_998877",
            "start_time": "2026-03-12T14:00:00",
            "attendees": ["user@email.com", "dave@corp.com", "sarah@corp.com", "maria@newcompany.com"],
            "response": "I'll add Maria to Project Sync meeting."
        }}

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
            # Convert history to Gemini format with proper role mapping
            contents = [{"role": "user", "parts": [{"text": message}]}]
            
            # Add conversation history with role mapping (assistant -> model)
            for msg in history:
                role = "model" if msg["role"] == "assistant" else "user"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})


            # Update API calls to use new client approach
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_instructions,
                    temperature=0.1
                )
            )
            
            content = response.text
            if not content:
                raise ValueError("Empty response from Gemini")
                
            # Parse JSON response (Gemini should return clean JSON)
            parsed_data = json.loads(content.strip())
            return ParsedIntent(**parsed_data)
            
        except json.JSONDecodeError as e:
            # Enhanced error logging for debugging
            print(f"JSON parsing error: {e}")
            print(f"Raw content: {content}")
            
            # Re-raise JSON parsing errors so chat.py can handle them
            raise ValueError(f"LLM returned invalid JSON: {e}")
        except Exception as e:
            # Check for specific API errors and re-raise them
            error_str = str(e).lower()
            if "402" in error_str or "insufficient balance" in error_str:
                raise ValueError(f"LLM API error: {e}")
            elif "rate limit" in error_str or "too many requests" in error_str:
                raise ValueError(f"LLM rate limit exceeded: {e}")
            elif "authentication" in error_str or "unauthorized" in error_str:
                raise ValueError(f"LLM authentication failed: {e}")
            else:
                # For other errors, log and re-raise for proper handling
                print(f"LLM service error: {e}")
                raise ValueError(f"LLM service error: {e}")
    
    async def generate_helpful_response(
        self, 
        message: str, 
        user_name: str, 
        user_email: str
    ) -> str:
        """Generate helpful AI response for general queries."""
        try:
            system_prompt = f"""You are ChronosAI, a friendly and intelligent meeting assistant helping {user_name} ({user_email}). 
            Your goal is to provide helpful, concise, and friendly responses to general user queries while subtly 
            reminding them of your capabilities like scheduling, checking availability, and managing meetings."""

            contents = [{"role": "user", "parts": [{"text": message}]}]
            
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.7,
                    max_output_tokens=500
                )
            )
            return response.text or "I'm here to help with your calendar. What can I do for you today?"
        except Exception as e:
            print(f"Error in generate_helpful_response: {e}")
            return "I'm here to help with your calendar. What can I do for you today?"

    async def generate_action_response(
        self,
        user_message: str,
        intent_data: Any,
        action_result: dict,
        history: List[Dict[str, Any]]
    ) -> str:
        """
        Generates a natural language explanation of calendar action taken.
        Understands the difference between successful actions and scheduling conflicts.
        """
        
        system_prompt = """
        You are ChronosAI. Your tone is professional, helpful, and concise.
        You have just performed an action on the user's Google Calendar.
        Your task is to explain the result naturally based on the action outcome.

        RULES:
        1. If 'action_result' contains a conflict or 'conflicts' key, suggest the 'optimal_times' provided.
        2. If an event was successfully deleted, confirm the specific event title.
        3. If an event was successfully scheduled/rescheduled, confirm details (time, attendees).
        4. If action_result contains 'suggestions', present them as helpful alternatives.
        5. Use user's local time for all schedule mentions.
        6. If the action failed, explain what went wrong and suggest next steps.
        7. Be empathetic but professional - acknowledge any inconvenience.

        RESPONSE EXAMPLES:
        Success: "✅ I've scheduled 'Team Sync' for tomorrow at 2:00 PM. I've invited john@example.com and jane@example.com."
        Conflict: "⚠️ That time slot conflicts with an existing meeting. Here are some alternatives: [suggested times]"

        IMPORTANT: Only explain what actually happened in the backend. Don't make up information.
        """

        # Contextual data for the LLM to explain what happened
        execution_context = {
            "user_input": user_message,
            "intent_detected": intent_data.dict(),
            "backend_outcome": action_result,
        }

        contents = [{"role": "user", "parts": [{"text": f"Result of action: {json.dumps(execution_context)}"}]}]
        
        # Add recent context from history with role mapping (assistant -> model)
        # pyre-ignore[16]
        recent_history = history[-3:] if len(history) >= 3 else history
        for msg in recent_history:
            role = "model" if msg["role"] == "assistant" else "user"
            contents.insert(-1, {"role": role, "parts": [{"text": msg["content"]}]})

        response = await self.client.aio.models.generate_content(
            model=self.model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=500
            )
        )

        return response.text

    async def generate_completion(self, prompt: str) -> str:
        """Generate simple completion for given prompt."""
        try:
            contents = [{"role": "user", "parts": [{"text": prompt}]}]
            
            response = await self.client.aio.models.generate_content(
                model=self.model,
                contents=contents,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=100
                )
            )
            return response.text or ""
        except Exception:
            return ""


llm_service = LLMService()