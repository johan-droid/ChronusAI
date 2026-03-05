from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_calendar_provider, get_current_user
from app.models.meeting import Meeting
from app.models.user import User
from app.schemas.meeting import Attendee, MeetingCreate, MeetingRead, MeetingUpdate

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("/", response_model=List[MeetingRead])
async def get_meetings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all meetings for the current user."""
    result = await db.execute(
        select(Meeting)
        .where(and_(Meeting.user_id == current_user.id, Meeting.status != "canceled"))
        .order_by(Meeting.start_time)
    )
    return list(result.scalars().all())


@router.get("/{meeting_id}", response_model=MeetingRead)
async def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific meeting by ID."""
    try:
        meeting_uuid = uuid.UUID(meeting_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid meeting id")
    result = await db.execute(
        select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == current_user.id))
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    return meeting


@router.put("/{meeting_id}", response_model=MeetingRead)
async def update_meeting(
    meeting_id: str,
    meeting_update: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    calendar_provider = Depends(get_calendar_provider),
    db: AsyncSession = Depends(get_db),
):
    """Update a meeting."""
    try:
        meeting_uuid = uuid.UUID(meeting_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid meeting id")
    result = await db.execute(
        select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == current_user.id))
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    try:
        # Update meeting data
        update_data = meeting_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            if field == "attendees" and value is not None:
                value = [a.model_dump() for a in value]
            setattr(meeting, field, value)
        
        meeting.updated_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        
        # Update in calendar if external event exists
        if meeting.external_event_id:
            meeting_create = MeetingCreate(
                title=str(meeting.title),
                description=str(meeting.description) if meeting.description else None,
                start_time=getattr(meeting, 'start_time'),
                end_time=getattr(meeting, 'end_time'),
                attendees=[Attendee(**a) for a in (getattr(meeting, 'attendees') or [])],
                provider=str(meeting.provider),
                raw_user_input=str(meeting.raw_user_input) if meeting.raw_user_input else None,
            )
            await calendar_provider.update_event(meeting.external_event_id, meeting_create)
        
        await db.commit()
        await db.refresh(meeting)
        
        return meeting
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update meeting: {str(e)}"
        )


@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    calendar_provider = Depends(get_calendar_provider),
    db: AsyncSession = Depends(get_db),
):
    """Cancel/delete a meeting."""
    try:
        meeting_uuid = uuid.UUID(meeting_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid meeting id")
    result = await db.execute(
        select(Meeting).where(and_(Meeting.id == meeting_uuid, Meeting.user_id == current_user.id))
    )
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    try:
        # Delete from calendar
        if meeting.external_event_id:
            await calendar_provider.delete_event(meeting.external_event_id)
        
        # Update status in database
        meeting.status = "canceled"  # type: ignore[assignment]
        meeting.updated_at = datetime.now(timezone.utc)  # type: ignore[assignment]
        await db.commit()
        
        return {"message": "Meeting canceled successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to cancel meeting: {str(e)}"
        )
