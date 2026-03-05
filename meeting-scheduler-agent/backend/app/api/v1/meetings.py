"""
API router for meetings CRUD operations.
"""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User, Meeting
from app.schemas.meeting import MeetingRead, MeetingListResponse
from app.dependencies import get_current_user


router = APIRouter(prefix="/meetings", tags=["Meetings"])


@router.get("", response_model=MeetingListResponse)
async def list_meetings(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List user's meetings with optional filtering.
    
    Returns meetings sorted by start_time descending (newest first).
    """
    query = select(Meeting).where(Meeting.user_id == user.id)
    
    if status_filter:
        query = query.where(Meeting.status == status_filter)
    
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(Meeting.start_time.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    meetings = result.scalars().all()
    
    return MeetingListResponse(
        meetings=[MeetingRead.model_validate(m) for m in meetings],
        total=total,
    )


@router.get("/{meeting_id}", response_model=MeetingRead)
async def get_meeting(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific meeting by ID."""
    result = await db.execute(
        select(Meeting).where(
            Meeting.id == meeting_id,
            Meeting.user_id == user.id,
        )
    )
    
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    
    return MeetingRead.model_validate(meeting)


@router.delete("/{meeting_id}")
async def cancel_meeting(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel/delete a meeting.
    
    Updates the meeting status to 'canceled' and optionally deletes from calendar.
    """
    result = await db.execute(
        select(Meeting).where(
            Meeting.id == meeting_id,
            Meeting.user_id == user.id,
        )
    )
    
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    
    # Update status to canceled
    meeting.status = "canceled"
    meeting.updated_at = datetime.now(timezone.utc)
    
    # TODO: Also delete from external calendar provider
    # This would require getting OAuth credentials and calling the calendar API
    
    await db.commit()
    
    return {"message": "Meeting canceled successfully", "meeting_id": str(meeting_id)}


@router.patch("/{meeting_id}", response_model=MeetingRead)
async def update_meeting(
    meeting_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a meeting.
    
    Note: Full implementation would accept update data in request body
    and sync changes with external calendar provider.
    """
    result = await db.execute(
        select(Meeting).where(
            Meeting.id == meeting_id,
            Meeting.user_id == user.id,
        )
    )
    
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found",
        )
    
    # TODO: Implement full update logic with calendar sync
    
    await db.commit()
    await db.refresh(meeting)
    
    return MeetingRead.model_validate(meeting)
