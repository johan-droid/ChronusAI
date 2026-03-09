from fastapi import APIRouter, Depends
from datetime import datetime
import pytz
from app.models.user import User
from app.dependencies import get_current_user
from app.services.llm_service import LLMService
from app.services.timezone_service import TimezoneDetectionService

router = APIRouter(prefix="/greetings", tags=["greetings"])

@router.get("/personalized")
async def get_personalized_greeting(
    timezone: str = "UTC",
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered personalized greeting based on user's timezone and cultural context."""
    try:
        tz = pytz.timezone(timezone)
        local_time = datetime.now(tz)
        hour = local_time.hour
        
        # Check if user has Indian context
        is_indian = TimezoneDetectionService.is_indian_context(timezone)
        
        # Determine time of day
        if 5 <= hour < 12:
            time_period = "morning"
        elif 12 <= hour < 17:
            time_period = "afternoon"
        elif 17 <= hour < 21:
            time_period = "evening"
        else:
            time_period = "night"
        
        # Generate cultural context-aware greeting
        llm_service = LLMService()
        
        if is_indian:
            # Indian cultural greeting
            prompt = f"""Generate a brief, warm, and culturally appropriate greeting (max 15 words) for {current_user.full_name} for {time_period} time in Indian context. 
Include subtle Indian cultural elements if appropriate (like 'Namaste', 'Jai Shri Krishna', or respectful Indian greetings). 
Make it motivational and calendar/productivity focused. Just return greeting text, nothing else."""
        else:
            # Global greeting
            prompt = f"""Generate a brief, warm, and professional greeting (max 15 words) for {current_user.full_name} for {time_period} time. 
Make it motivational and calendar/productivity focused. Just return greeting text, nothing else."""
        
        ai_greeting = await llm_service.generate_completion(prompt)
        
        return {
            "greeting": ai_greeting.strip(),
            "time_period": time_period,
            "local_time": local_time.strftime("%I:%M %p"),
            "timezone": timezone,
            "is_indian": is_indian,
            "cultural_context": "indian" if is_indian else "global"
        }
    except Exception:
        # Fallback greeting with cultural context
        is_indian = TimezoneDetectionService.is_indian_context(timezone)
        fallback_greeting = f"Welcome back, {current_user.full_name}! Ready to conquer your schedule?"
        
        if is_indian:
            fallback_greeting = f"Namaste, {current_user.full_name}! Ready to organize your day?"
        
        return {
            "greeting": fallback_greeting,
            "time_period": "day",
            "local_time": datetime.now().strftime("%I:%M %p"),
            "timezone": timezone,
            "is_indian": is_indian,
            "cultural_context": "indian" if is_indian else "global"
        }
