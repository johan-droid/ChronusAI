from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.dependencies import get_current_user, get_db
from app.services.timezone_service import TimezoneDetectionService
from app.db.session import AsyncSessionLocal
import structlog

router = APIRouter(prefix="/users", tags=["users"])
logger = structlog.get_logger()


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get current user information with timezone detection."""
    # Get headers for IP detection
    forwarded_for = request.headers.get("x-forwarded-for")
    
    # Detect timezone from IP in background (don't block response)
    try:
        detected_tz = await TimezoneDetectionService.detect_and_update_user_timezone(
            current_user,
            dict(request.headers),
            forwarded_for
        )
        # If timezone changed, update it
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
                        "user_timezone_auto_updated",
                        user_id=str(user.id),
                        new_timezone=detected_tz
                    )
    except Exception as e:
        logger.error("timezone_detection_error", error=str(e))
    
    return current_user


@router.post("/detect-timezone")
async def detect_user_timezone(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Detect user's timezone from their IP address and update their profile.
    Returns the detected timezone.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    
    # Detect timezone
    detected_tz = await TimezoneDetectionService.detect_and_update_user_timezone(
        current_user,
        dict(request.headers),
        forwarded_for
    )
    
    # Update user if timezone changed
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
        "detected": detected_tz != "UTC" if detected_tz else False,
        "source": "ip_geolocation"
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
