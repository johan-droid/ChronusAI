from fastapi import APIRouter, Depends
from datetime import datetime
import pytz
from app.models.user import User
from app.dependencies import get_current_user
from app.services.llm_service import LLMService

router = APIRouter(prefix="/greetings", tags=["greetings"])

@router.get("/personalized")
async def get_personalized_greeting(
    timezone: str = "UTC",
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered personalized greeting based on user's timezone."""
    try:
        tz = pytz.timezone(timezone)
        local_time = datetime.now(tz)
        hour = local_time.hour
        
        # Determine time of day
        if 5 <= hour < 12:
            time_period = "morning"
        elif 12 <= hour < 17:
            time_period = "afternoon"
        elif 17 <= hour < 21:
            time_period = "evening"
        else:
            time_period = "night"
        
        # Generate AI greeting
        llm_service = LLMService()
        prompt = f"""Generate a brief, warm, and professional greeting (max 15 words) for {current_user.full_name} for {time_period} time. 
Make it motivational and calendar/productivity focused. Just return the greeting text, nothing else."""
        
        ai_greeting = await llm_service.generate_completion(prompt)
        
        return {
            "greeting": ai_greeting.strip(),
            "time_period": time_period,
            "local_time": local_time.strftime("%I:%M %p"),
            "timezone": timezone
        }
    except Exception as e:
        # Fallback greeting
        return {
            "greeting": f"Welcome back, {current_user.full_name}! Ready to conquer your schedule?",
            "time_period": "day",
            "local_time": datetime.now().strftime("%I:%M %p"),
            "timezone": "UTC"
        }
