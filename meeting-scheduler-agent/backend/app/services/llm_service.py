"""
LLM service for intent detection and entity extraction using LangChain and GPT-4o.
Returns structured Pydantic models, never raw text.
"""
import json
from datetime import date, datetime, time, timezone
from typing import List, Literal, Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, EmailStr, Field

from app.config import get_settings


settings = get_settings()


class ParsedIntent(BaseModel):
    """
    Structured output from LLM for meeting scheduling intents.
    
    This schema is used with LangChain's structured output / function calling.
    """
    
    intent: Literal[
        "CREATE_MEETING",
        "UPDATE_MEETING",
        "CANCEL_MEETING",
        "QUERY_AVAILABILITY",
        "UNKNOWN"
    ] = Field(..., description="The detected intent from the user's message")
    
    title: Optional[str] = Field(None, description="Meeting title/subject")
    
    attendees: List[EmailStr] = Field(
        default_factory=list,
        description="List of attendee email addresses"
    )
    
    target_date: Optional[date] = Field(
        None,
        description="Resolved absolute date (ISO 8601) for the meeting"
    )
    
    target_time: Optional[time] = Field(
        None,
        description="Resolved absolute time for the meeting"
    )
    
    time_preference: Optional[Literal["morning", "afternoon", "evening"]] = Field(
        None,
        description="Preferred time of day if exact time not specified"
    )
    
    duration_minutes: Optional[int] = Field(
        30,
        description="Meeting duration in minutes (default: 30)"
    )
    
    meeting_id_to_modify: Optional[str] = Field(
        None,
        description="Meeting ID for UPDATE or CANCEL intents"
    )
    
    clarification_needed: Optional[str] = Field(
        None,
        description="Question to ask user if critical information is missing"
    )


class LLMService:
    """
    Service for interacting with OpenAI's GPT-4o for natural language understanding.
    """
    
    def __init__(self):
        """Initialize the LLM service with OpenAI client."""
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            temperature=0,
            api_key=settings.OPENAI_API_KEY,
        )
    
    def _build_system_prompt(self, current_utc: str, user_timezone: str) -> str:
        """
        Build the system prompt for the LLM.
        
        Args:
            current_utc: Current UTC datetime in ISO format.
            user_timezone: User's timezone string (e.g., 'America/New_York').
            
        Returns:
            System prompt string.
        """
        return f"""You are a meeting scheduling assistant. The current UTC datetime is {current_utc}.
The user's local timezone is {user_timezone}.

Extract meeting details from the user's message and return a structured JSON matching
the ParsedIntent schema. Rules:
- Resolve ALL relative dates ("tomorrow", "next Friday", "EOD") to absolute ISO 8601 dates
  using the current UTC time and the user's timezone.
- If critical info is missing (date, time for CREATE_MEETING), set clarification_needed
  to a natural follow-up question instead of guessing.
- For CANCEL/UPDATE intents, identify the meeting by title or date reference.
- Never invent attendee email addresses. Only use what the user explicitly provides.
- Default duration to 30 minutes if unspecified.
- Time preferences: morning = 8am-12pm, afternoon = 12pm-5pm, evening = 5pm-8pm
- Be precise with date/time resolution - use the provided UTC time as reference.
- If the user says something unrelated to scheduling, set intent to UNKNOWN."""
    
    async def parse_intent(
        self,
        message: str,
        user_timezone: str = "UTC",
        conversation_history: Optional[List[dict]] = None,
    ) -> ParsedIntent:
        """
        Parse user message to extract meeting scheduling intent.
        
        Args:
            message: User's natural language message.
            user_timezone: User's timezone for date/time resolution.
            conversation_history: Optional list of previous messages for context.
            
        Returns:
            ParsedIntent object with extracted entities and intent.
        """
        current_utc = datetime.now(timezone.utc).isoformat()
        
        # Build prompt with conversation history
        messages = [
            SystemMessage(content=self._build_system_prompt(current_utc, user_timezone)),
        ]
        
        # Add conversation history if available (last 6 messages = 3 turns)
        if conversation_history:
            for msg in conversation_history[-6:]:
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(SystemMessage(content=msg["content"]))
        
        # Add current message
        messages.append(HumanMessage(content=message))
        
        # Use LangChain's with_structured_output for guaranteed schema compliance
        llm_with_schema = self.llm.with_structured_output(ParsedIntent)
        
        # Invoke LLM
        result = await llm_with_schema.ainvoke(messages)
        
        return result
    
    async def generate_clarification_response(
        self,
        parsed_intent: ParsedIntent,
        user_message: str,
    ) -> str:
        """
        Generate a natural language clarification question when info is missing.
        
        Args:
            parsed_intent: The parsed intent with clarification_needed field.
            user_message: Original user message.
            
        Returns:
            Natural language clarification question.
        """
        if parsed_intent.clarification_needed:
            return parsed_intent.clarification_needed
        
        # Generate a clarification based on missing fields
        missing = []
        
        if parsed_intent.intent == "CREATE_MEETING":
            if not parsed_intent.target_date:
                missing.append("when you'd like to schedule this meeting")
            if not parsed_intent.target_time and not parsed_intent.time_preference:
                missing.append("what time works best")
            if not parsed_intent.title:
                missing.append("a title for the meeting")
        
        if missing:
            return f"Could you please tell me {', '.join(missing)}?"
        
        return "I need a bit more information to help you with that."


# Global instance
llm_service = LLMService()
