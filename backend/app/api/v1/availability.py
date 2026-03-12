from datetime import datetime, time, timedelta
from zoneinfo import ZoneInfo
from typing import List

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.dependencies import get_calendar_provider, get_current_user
from app.models.user import User
from app.schemas.availability import AvailabilityResponse, TimeSlotResponse, SlotStatus

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get("", response_model=AvailabilityResponse)
async def check_availability(
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    timezone: str | None = Query(None, description="Timezone (e.g., America/New_York)"),
    current_user: User = Depends(get_current_user),
    calendar_provider = Depends(get_calendar_provider),
    db: AsyncSession = Depends(get_db),
):
    """Get availability slots for a specific date with enhanced future-only filter."""
    try:
        # Parse date
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        # Use user's timezone or provided timezone
        tz_str = timezone or str(current_user.timezone)
        try:
            tz = ZoneInfo(tz_str)
        except Exception:
            tz = ZoneInfo("UTC")
        
        # Define working hours (8 AM to 8 PM)
        start_of_day = datetime.combine(target_date, time(8, 0)).replace(tzinfo=tz)
        end_of_day = datetime.combine(target_date, time(20, 0)).replace(tzinfo=tz)
        
        # Enhanced future-only filter: if date is today, start from current time
        now = datetime.now(tz)
        if target_date == now.date():
            # If checking availability for today, start from current time in user's timezone
            start_of_day = max(start_of_day, now)
        
        # Get busy slots from calendar
        busy_slots = await calendar_provider.get_free_busy(
            start_of_day, end_of_day, [str(current_user.email)]
        )

        # Fetch actual events to get titles for busy slots
        calendar_events = []
        try:
            calendar_events = await calendar_provider.list_events(start_of_day, end_of_day)
        except Exception as ev_err:
            import logging
            logging.getLogger(__name__).warning("Could not fetch event titles: %s", ev_err)

        def _find_event_title(slot_start: datetime, slot_end: datetime) -> str | None:
            """Return the summary of the calendar event overlapping this slot."""
            for ev in calendar_events:
                ev_start_raw = ev.get("start")
                ev_end_raw = ev.get("end")
                # list_events may return datetime objects directly or ISO strings
                def _to_aware_dt(val):
                    if val is None:
                        return None
                    if isinstance(val, datetime):
                        return val
                    if isinstance(val, dict):
                        s = val.get("dateTime") or val.get("date")
                        if s:
                            return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
                        return None
                    if isinstance(val, str):
                        return datetime.fromisoformat(val.replace("Z", "+00:00"))
                    return None
                ev_start = _to_aware_dt(ev_start_raw)
                ev_end = _to_aware_dt(ev_end_raw)
                if not ev_start or not ev_end:
                    continue
                # Check overlap: not (slot_end <= ev_start or slot_start >= ev_end)
                if not (slot_end <= ev_start or slot_start >= ev_end):
                    return ev.get("summary") or None
            return None
        
        # Generate 30-minute time slots
        all_slots: List[TimeSlotResponse] = []
        current_slot = start_of_day
        slot_duration = timedelta(minutes=30)
        
        # Current time in target timezone for filtering past slots
        now = datetime.now(tz)
        
        while current_slot < end_of_day:
            slot_end = current_slot + slot_duration
            
            # Check if slot conflicts with any busy period
            is_busy = any(
                not (slot_end <= busy.start or current_slot >= busy.end)
                for busy in busy_slots
            )
            
            # Check if slot is in past
            is_past = slot_end <= now
            
            # Determine slot status and event title
            event_title = None
            if is_past:
                slot_status = SlotStatus.PAST
                is_available = False
            elif is_busy:
                slot_status = SlotStatus.BUSY
                is_available = False
                event_title = _find_event_title(current_slot, slot_end)
            else:
                slot_status = SlotStatus.AVAILABLE
                is_available = True
            
            all_slots.append(TimeSlotResponse(
                start_time=current_slot.isoformat(),
                end_time=slot_end.isoformat(),
                is_available=is_available,
                status=slot_status,
                timezone=tz_str,
                event_title=event_title,
            ))
            
            current_slot = slot_end
        
        # Count available, busy, and past slots
        available_count = sum(1 for slot in all_slots if slot.status == SlotStatus.AVAILABLE)
        busy_count = sum(1 for slot in all_slots if slot.status == SlotStatus.BUSY)
        past_count = sum(1 for slot in all_slots if slot.status == SlotStatus.PAST)
        
        return AvailabilityResponse(
            date=date,
            timezone=tz_str,
            slots=all_slots,
            available_count=available_count,
            busy_count=busy_count,
            past_count=past_count
        )
        
    except ValueError:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    except Exception as e:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check availability: {str(e)}"
        )
