from datetime import date, datetime, timezone

from app.services.calendar_provider import TimeSlot
from app.services.scheduler_service import find_available_slot


def test_find_available_slot_empty_calendar_returns_first_slot():
    slot = find_available_slot(
        busy_slots=[],
        duration_minutes=30,
        target_date=date(2026, 3, 4),
        time_preference="morning",
        user_timezone="UTC",
    )
    assert slot is not None
    assert slot.start == datetime(2026, 3, 4, 8, 0, tzinfo=timezone.utc)
    assert slot.end == datetime(2026, 3, 4, 8, 30, tzinfo=timezone.utc)


def test_find_available_slot_skips_busy_blocks():
    busy = [
        TimeSlot(
            start=datetime(2026, 3, 4, 8, 0, tzinfo=timezone.utc),
            end=datetime(2026, 3, 4, 9, 0, tzinfo=timezone.utc),
        ),
        TimeSlot(
            start=datetime(2026, 3, 4, 10, 0, tzinfo=timezone.utc),
            end=datetime(2026, 3, 4, 11, 0, tzinfo=timezone.utc),
        ),
    ]
    slot = find_available_slot(
        busy_slots=busy,
        duration_minutes=30,
        target_date=date(2026, 3, 4),
        time_preference="morning",
        user_timezone="UTC",
    )
    assert slot is not None
    assert slot.start == datetime(2026, 3, 4, 9, 0, tzinfo=timezone.utc)
    assert slot.end == datetime(2026, 3, 4, 9, 30, tzinfo=timezone.utc)


def test_find_available_slot_fully_booked_returns_none():
    busy = [
        TimeSlot(
            start=datetime(2026, 3, 4, 8, 0, tzinfo=timezone.utc),
            end=datetime(2026, 3, 4, 12, 0, tzinfo=timezone.utc),
        )
    ]
    slot = find_available_slot(
        busy_slots=busy,
        duration_minutes=30,
        target_date=date(2026, 3, 4),
        time_preference="morning",
        user_timezone="UTC",
    )
    assert slot is None

