from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis

from app.config import settings


class RedisClient:
    def __init__(self, url: str):
        self._url = url
        self.client: redis.Redis | None = None

    async def connect(self) -> None:
        self.client = redis.from_url(self._url, encoding="utf-8", decode_responses=True)
        # Ping to fail fast
        result = await self.client.ping()  # type: ignore[misc]
        # Ensure we have a boolean result
        if isinstance(result, bool):
            ping_result = result
        else:
            ping_result = bool(result)
        if not ping_result:
                raise RuntimeError("Redis ping failed")

    async def disconnect(self) -> None:
        if self.client is not None:
            await self.client.aclose()
            self.client = None

    def _require(self) -> redis.Redis:
        if self.client is None:
            raise RuntimeError("Redis client is not connected")
        return self.client

    async def get(self, key: str) -> str | None:
        return await self._require().get(key)

    async def set(self, key: str, value: str, ex: int | None = 3600) -> bool:
        # redis-py returns True/False for set with ex
        return bool(await self._require().set(name=key, value=value, ex=ex))

    async def delete(self, key: str) -> int:
        return int(await self._require().delete(key))

    async def set_json(self, key: str, value: dict[str, Any], ex: int | None = 3600) -> bool:
        return await self.set(key, json.dumps(value), ex=ex)

    async def get_json(self, key: str) -> dict[str, Any] | None:
        raw = await self.get(key)
        if raw is None:
            return None
        return json.loads(raw)


redis_client = RedisClient(settings.redis_url)

