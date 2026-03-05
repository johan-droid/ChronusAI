"""
Scheduler service for conflict resolution and slot finding.
Implements the core algorithm for finding available meeting times.
"""
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Optional

import pytz

from app.services.calendar_provider import TimeSlot


def find_available_slot(
    busy_slots: List[TimeSlot],
    duration_minutes: int,
    target_date: date,
    time_preference: Optional[str] = None,
    user_timezone: str = "UTC",
) -> Optional[TimeSlot]:
    """
    Find an available time slot for a meeting.
    
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
    
    Args:
        busy_slots: List of busy TimeSlot objects.
        duration_minutes: Required meeting duration in minutes.
        target_date: Target date for the meeting.
        time_preference: Preferred time of day (morning/afternoon/evening).
        user_timezone: User's timezone string.
        
    Returns:
        Available TimeSlot or None if no slot found.
    """
    tz = pytz.timezone(user_timezone)
    
    # Define search window based on time preference
    if time_preference == "morning":
        start_hour, end_hour = 8, 12
    elif time_preference == "afternoon":
        start_hour, end_hour = 12, 17
    elif time_preference == "evening":
        start_hour, end_hour = 17, 20
    else:
        start_hour, end_hour = 8, 20
    
    # Create datetime objects in user's timezone
    window_start = tz.localize(datetime.combine(target_date, time(start_hour, 0)))
    window_end = tz.localize(datetime.combine(target_date, time(end_hour, 0)))
    
    # Convert to UTC for comparison with busy slots
    window_start_utc = window_start.astimezone(timezone.utc)
    window_end_utc = window_end.astimezone(timezone.utc)
    
    # Filter busy slots that overlap with our window
    relevant_busy = []
    for slot in busy_slots:
        # Ensure slots are timezone-aware
        slot_start = slot.start
        slot_end = slot.end
        
        if slot_start.tzinfo is None:
            slot_start = tz.localize(slot_start)
        if slot_end.tzinfo is None:
            slot_end = tz.localize(slot_end)
        
        # Check if slot overlaps with window
        if slot_start < window_end_utc and slot_end > window_start_utc:
            relevant_busy.append(TimeSlot(
                start=max(slot_start, window_start_utc),
                end=min(slot_end, window_end_utc)
            ))
    
    # Sort busy slots by start time
    relevant_busy.sort(key=lambda s: s.start)
    
    # Merge overlapping busy slots
    merged_busy = []
    for slot in relevant_busy:
        if merged_busy and slot.start <= merged_busy[-1].end:
            # Overlapping, extend the last slot
            merged_busy[-1] = TimeSlot(
                start=merged_busy[-1].start,
                end=max(merged_busy[-1].end, slot.end)
            )
        else:
            merged_busy.append(slot)
    
    # Find gaps between busy slots
    duration_delta = timedelta(minutes=duration_minutes)
    
    # Check gap before first busy slot
    if merged_busy:
        current_time = window_start_utc
        for busy_slot in merged_busy:
            gap_start = current_time
            gap_end = busy_slot.start
            
            if (gap_end - gap_start) >= duration_delta:
                # Found a gap
                return TimeSlot(start=gap_start, end=gap_start + duration_delta)
            
            current_time = max(current_time, busy_slot.end)
        
        # Check gap after last busy slot
        if (window_end_utc - current_time) >= duration_delta:
            return TimeSlot(start=current_time, end=current_time + duration_delta)
    else:
        # No busy slots, return start of window
        return TimeSlot(start=window_start_utc, end=window_start_utc + duration_delta)
    
    return None


def get_next_business_day(
    current_date: date,
    user_timezone: str = "UTC",
) -> date:
    """
    Get the next business day (skip weekends).
    
    Args:
        current_date: Current date.
        user_timezone: User's timezone.
        
    Returns:
        Next business day date.
    """
    next_day = current_date + timedelta(days=1)
    
    # Skip weekends (Saturday = 5, Sunday = 6)
    while next_day.weekday() >= 5:
        next_day += timedelta(days=1)
    
    return next_day


def search_multiple_days(
    busy_slots: List[TimeSlot],
    duration_minutes: int,
    start_date: date,
    time_preference: Optional[str] = None,
    user_timezone: str = "UTC",
    max_days: int = 7,
) -> Optional[tuple[date, TimeSlot]]:
    """
    Search for available slots across multiple days.
    
    Args:
        busy_slots: List of busy TimeSlot objects.
        duration_minutes: Required meeting duration.
        start_date: Starting date to search from.
        time_preference: Preferred time of day.
        user_timezone: User's timezone.
        max_days: Maximum number of days to search.
        
    Returns:
        Tuple of (date, TimeSlot) or None if no slot found.
    """
    current_date = start_date
    days_searched = 0
    
    while days_searched < max_days:
        # Filter busy slots for current date
        tz = pytz.timezone(user_timezone)
        day_start = tz.localize(datetime.combine(current_date, time(0, 0)))
        day_end = tz.localize(datetime.combine(current_date, time(23, 59, 59)))
        
        day_start_utc = day_start.astimezone(timezone.utc)
        day_end_utc = day_end.astimezone(timezone.utc)
        
        day_busy = [
            slot for slot in busy_slots
            if day_start_utc <= slot.start <= day_end_utc
        ]
        
        # Try to find slot on this day
        slot = find_available_slot(
            busy_slots=day_busy,
            duration_minutes=duration_minutes,
            target_date=current_date,
            time_preference=time_preference,
            user_timezone=user_timezone,
        )
        
        if slot:
            return (current_date, slot)
        
        # Move to next business day
        current_date = get_next_business_day(current_date, user_timezone)
        days_searched += 1
    
    return None
