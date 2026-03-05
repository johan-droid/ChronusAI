from typing import List, Optional
from datetime import datetime, date, time, timedelta
from app.services.calendar_provider import TimeSlot
from zoneinfo import ZoneInfo


def find_available_slot(
    busy_slots: List[TimeSlot],
    duration_minutes: int,
    target_date: date,
    time_preference: Optional[str],
    user_timezone: str
) -> Optional[TimeSlot]:
    """
    Algorithm:
    1. Define search window based on time_preference:
       - morning:   08:00 – 12:00 local time
       - afternoon: 12:00 – 17:00 local time
       - evening:   17:00 – 20:00 local time
       - None:      08:00 – 20:00 local time
    2. Convert window to UTC for comparison.
    3. Sort busy_slots by start time.
    4. Iterate through gaps between busy slots.
    5. Return the FIRST gap >= duration_minutes.
    6. If no gap found in search window, return None.
       Caller must then query next business day.
    """
    try:
        tz = ZoneInfo(user_timezone)
    except Exception:
        tz = ZoneInfo("UTC")
    
    # Define search window in local timezone
    if time_preference == "morning":
        window_start = datetime.combine(target_date, time(8, 0))
        window_end = datetime.combine(target_date, time(12, 0))
    elif time_preference == "afternoon":
        window_start = datetime.combine(target_date, time(12, 0))
        window_end = datetime.combine(target_date, time(17, 0))
    elif time_preference == "evening":
        window_start = datetime.combine(target_date, time(17, 0))
        window_end = datetime.combine(target_date, time(20, 0))
    else:
        window_start = datetime.combine(target_date, time(8, 0))
        window_end = datetime.combine(target_date, time(20, 0))
    
    # Convert to UTC
    window_start_utc = window_start.replace(tzinfo=tz).astimezone(ZoneInfo("UTC"))
    window_end_utc = window_end.replace(tzinfo=tz).astimezone(ZoneInfo("UTC"))
    
    # Sort busy slots by start time
    busy_slots_sorted = sorted(busy_slots, key=lambda x: x.start)
    
    # Filter busy slots to only those within our window
    relevant_busy = []
    for slot in busy_slots_sorted:
        if slot.end <= window_start_utc or slot.start >= window_end_utc:
            continue
        relevant_busy.append(slot)
    
    # Check for available slots
    current_time = window_start_utc
    
    for busy_slot in relevant_busy:
        # Check if there's a gap before this busy slot
        if busy_slot.start - current_time >= timedelta(minutes=duration_minutes):
            return TimeSlot(
                start=current_time,
                end=current_time + timedelta(minutes=duration_minutes)
            )
        # Move current time past this busy slot
        current_time = max(current_time, busy_slot.end)
    
    # Check if there's space after the last busy slot
    if window_end_utc - current_time >= timedelta(minutes=duration_minutes):
        return TimeSlot(
            start=current_time,
            end=current_time + timedelta(minutes=duration_minutes)
        )
    
    return None


def get_next_business_day(current_date: date) -> date:
    """Get the next business day (Monday-Friday)."""
    next_day = current_date + timedelta(days=1)
    while next_day.weekday() >= 5:  # Saturday (5) or Sunday (6)
        next_day += timedelta(days=1)
    return next_day
