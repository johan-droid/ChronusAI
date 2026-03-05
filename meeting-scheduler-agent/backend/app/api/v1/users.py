"""
API router for user-related endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserRead, UserUpdate
from app.dependencies import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead)
async def get_current_user_info(
    user: User = Depends(get_current_user),
):
    """Get current authenticated user's information."""
    return UserRead.model_validate(user)


@router.patch("/me", response_model=UserRead)
async def update_current_user(
    update_data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user's profile information.
    
    Can update full_name and timezone.
    """
    if update_data.full_name is not None:
        user.full_name = update_data.full_name
    
    if update_data.timezone is not None:
        user.timezone = update_data.timezone
    
    await db.commit()
    await db.refresh(user)
    
    return UserRead.model_validate(user)
