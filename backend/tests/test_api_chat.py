from datetime import date, time

import pytest
from httpx import ASGITransport, AsyncClient

from app.dependencies import get_calendar_provider
from app.main import app
from app.schemas.chat import ParsedIntent
from app.services.calendar_provider import CalendarProvider
from app.services.llm_service import llm_service


class _FakeProvider(CalendarProvider):
    async def get_free_busy(self, start, end, attendees):
        return []

    async def create_event(self, meeting):
        return "evt_test_123"

    async def delete_event(self, external_event_id: str) -> bool:
        return True

    async def update_event(self, external_event_id: str, meeting) -> bool:
        return True


@pytest.mark.anyio
async def test_chat_message_creates_meeting(override_db, seeded_user, user_jwt, monkeypatch):
    # Avoid Redis dependency in this test
    import app.api.v1.chat as chat_api
    
    # Create proper mock functions that match the expected signatures
    async def _no_context(user_id: str):
        return []
    
    async def _no_save(user_id: str, messages: list):
        return None
    
    # Mock the functions in the module where they're used
    monkeypatch.setattr(chat_api, "get_conversation_context", _no_context)
    monkeypatch.setattr(chat_api, "save_conversation_context", _no_save)

    async def _fake_parse(message: str, user_timezone: str, context):
        return ParsedIntent(
            intent="CREATE_MEETING",
            title="Sync",
            attendees=["alex@corp.com"],
            target_date=date(2026, 3, 6),
            target_time=time(15, 0),
            duration_minutes=30,
            time_preference=None,
            meeting_id_to_modify=None,
            clarification_needed=None,
        )

    monkeypatch.setattr(llm_service, "parse_intent", _fake_parse)

    async def _override_calendar_provider(*args, **kwargs):
        return _FakeProvider()

    app.dependency_overrides[get_calendar_provider] = _override_calendar_provider

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/api/v1/chat/message",
            headers={"Authorization": f"Bearer {user_jwt}"},
            json={"message": "Schedule a sync with alex@corp.com on Mar 6 at 3pm"},
        )
    print(f"Response status: {resp.status_code}")
    print(f"Response body: {resp.text}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["intent"] == "CREATE_MEETING"
    assert data["meeting"] is not None

