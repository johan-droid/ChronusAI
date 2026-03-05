import pytest

from app.schemas.chat import ParsedIntent
from app.services.llm_service import llm_service


class _FakeStructuredLLM:
    def __init__(self, result: ParsedIntent):
        self._result = result
        self.last_messages = None

    async def ainvoke(self, messages):
        self.last_messages = messages
        return self._result


@pytest.mark.anyio
async def test_llm_service_returns_parsed_intent(monkeypatch):
    fake = _FakeStructuredLLM(
        ParsedIntent(
            intent="CREATE_MEETING",
            title="Sync",
            attendees=["alex@corp.com"],
            duration_minutes=30,
            target_date="2026-03-06",
            target_time="15:00:00",
            time_preference=None,
            meeting_id_to_modify=None,
            clarification_needed=None,
        )
    )
    monkeypatch.setattr(llm_service, "_llm", fake)

    intent = await llm_service.parse_intent(
        "Schedule a sync with alex@corp.com next Friday at 3pm",
        user_timezone="UTC",
        context=[{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}],
    )

    assert intent.intent == "CREATE_MEETING"
    assert intent.attendees == ["alex@corp.com"]
    assert fake.last_messages is not None

