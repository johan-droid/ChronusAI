import pytest

from app.schemas.chat import ParsedIntent
from app.services.llm_service import llm_service


class _FakeStructuredLLM:
    def __init__(self, result: ParsedIntent):
        self._result = result
        self.last_messages = None

    async def chat_completions_create(self, **kwargs):
        self.last_messages = kwargs.get("messages")
        # Return a mock response object
        class MockChoice:
            def __init__(self, content):
                self.message = type('obj', (object,), {'content': content})
        
        class MockResponse:
            def __init__(self, content):
                self.choices = [MockChoice(content)]
        
        import json
        return MockResponse(json.dumps(self._result.model_dump()))

    @property
    def chat(self):
        return type('obj', (object,), {
            'completions': type('obj', (object,), {
                'create': self.chat_completions_create
            })
        })


@pytest.mark.anyio
async def test_llm_service_returns_parsed_intent(monkeypatch):
    fake = _FakeStructuredLLM(
        ParsedIntent(
            intent="schedule",
            title="Sync",
            attendees=["alex@corp.com"],
            start_time="2026-03-06T15:00:00+00:00",
            end_time="2026-03-06T15:30:00+00:00",
            response="Meeting scheduled successfully"
        )
    )
    monkeypatch.setattr(llm_service, "_client", fake)

    intent = await llm_service.parse_intent(
        "Schedule a sync with alex@corp.com next Friday at 3pm",
        user_timezone="UTC",
        context=[{"role": "user", "content": "hi"}, {"role": "assistant", "content": "hello"}],
    )

    assert intent.intent == "schedule"
    assert intent.attendees == ["alex@corp.com"]
    assert fake.last_messages is not None

