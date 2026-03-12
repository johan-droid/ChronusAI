from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.dependencies import get_current_user, get_db
from app.services.timezone_service import TimezoneDetectionService
from app.core.security import revoke_all_user_sessions
from app.db.session import AsyncSessionLocal
import structlog

router = APIRouter(prefix="/users", tags=["users"])
logger = structlog.get_logger()


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get current user information with timezone and cultural context detection."""
    # Get headers for IP detection
    forwarded_for = request.headers.get("x-forwarded-for")
    
    # Detect timezone and cultural context from IP in background (don't block response)
    try:
        detected_context = await TimezoneDetectionService.detect_and_update_user_timezone(
            current_user,
            dict(request.headers),
            forwarded_for
        )
        
        # If timezone changed, update it
        if detected_context:
            detected_tz = detected_context.get("timezone")
            if detected_tz and detected_tz != current_user.timezone:
                async with AsyncSessionLocal() as db:
                    from sqlalchemy import select
                    result = await db.execute(
                        select(User).where(User.id == current_user.id)
                    )
                    user = result.scalar_one_or_none()
                    if user:
                        user.timezone = detected_tz
                        await db.commit()
                        current_user.timezone = detected_tz
                        logger.info(
                            "user_timezone_and_context_auto_updated",
                            user_id=str(user.id),
                            new_timezone=detected_tz,
                            is_indian=detected_context.get("is_indian", False)
                        )
    except Exception as e:
        logger.error("timezone_and_context_detection_error", error=str(e))
    
    return current_user


@router.post("/detect-timezone")
async def detect_user_timezone(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Detect user's timezone and cultural context from their IP address and update their profile.
    Returns detected timezone and cultural context.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    
    # Detect timezone and cultural context
    detected_context = await TimezoneDetectionService.detect_and_update_user_timezone(
        current_user,
        dict(request.headers),
        forwarded_for
    )
    
    # Update user if timezone changed
    if detected_context:
        detected_tz = detected_context.get("timezone")
        if detected_tz and detected_tz != current_user.timezone:
            async with AsyncSessionLocal() as db:
                from sqlalchemy import select
                result = await db.execute(
                    select(User).where(User.id == current_user.id)
                )
                user = result.scalar_one_or_none()
                if user:
                    user.timezone = detected_tz
                    await db.commit()
                    current_user.timezone = detected_tz
    
    return {
        "timezone": current_user.timezone,
        "detected": detected_context.get("is_indian", False) if detected_context else False,
        "cultural_context": detected_context.get("cultural_context", "global") if detected_context else "global",
        "country": detected_context.get("country", "") if detected_context else "",
        "source": "ip_geolocation"
    }


@router.get("/indian-context")
async def get_indian_context(
    current_user: User = Depends(get_current_user)
):
    """
    Get Indian cultural context including festivals and scheduling preferences.
    """
    try:
        # Check if user has Indian context
        is_indian = TimezoneDetectionService.is_indian_context(str(current_user.timezone))
        
        if is_indian:
            festivals = TimezoneDetectionService.get_indian_festivals()
            
            # Indian scheduling preferences
            preferences = {
                "avoid_mahurat": False,  # Can be customized
                "consider_festivals": True,
                "business_hours": {
                    "start": "09:00",
                    "end": "18:00",
                    "weekdays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                },
                "lunch_break": {
                    "start": "13:00",
                    "end": "14:00"
                }
            }
            
            return {
                "is_indian": True,
                "cultural_context": "indian",
                "festivals": festivals,
                "preferences": preferences,
                "timezone": current_user.timezone
            }
        else:
            return {
                "is_indian": False,
                "cultural_context": "global",
                "festivals": {},
                "preferences": {
                    "business_hours": {
                        "start": "09:00",
                        "end": "17:00"
                    }
                },
                "timezone": current_user.timezone
            }
            
    except Exception as e:
        logger.error("indian_context_error", error=str(e))
        return {
            "is_indian": False,
            "cultural_context": "global",
            "error": str(e)
        }


@router.put("/me", response_model=UserRead)
async def update_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user information including timezone."""
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    
    if user_update.timezone is not None:
        # Validate timezone
        try:
            import pytz
            pytz.timezone(user_update.timezone)
            current_user.timezone = user_update.timezone
            logger.info(
                "user_timezone_manually_updated",
                user_id=str(current_user.id),
                new_timezone=user_update.timezone
            )
        except pytz.exceptions.UnknownTimeZoneError:
            return {"detail": "Invalid timezone"}
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.delete("/me")
async def delete_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete the current user's account and revoke all sessions."""
    user_id = str(current_user.id)

    # Revoke all refresh-token sessions
    await revoke_all_user_sessions(user_id)

    # Delete the user row (cascade will handle related records)
    await db.delete(current_user)
    await db.commit()

    # Clear the refresh cookie
    response.delete_cookie(
        "chronos_refresh",
        path="/",
        httponly=True,
        samesite="none",
        secure=True,
    )

    logger.info("user_account_deleted", user_id=user_id)
    return {"message": "Account deleted successfully."}
