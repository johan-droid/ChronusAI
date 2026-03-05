from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis

from app.config import settings


class RedisClient:
    def __init__(self, url: str | None):
        self._url = url
        self.client: redis.Redis | None = None
        self._enabled = url is not None

    async def connect(self) -> None:
        if not self._enabled:
            return
        self.client = redis.from_url(self._url, encoding="utf-8", decode_responses=True)
        try:
            result = await self.client.ping()
            ping_result = bool(result)
            if not ping_result:
                raise RuntimeError("Redis ping failed")
        except Exception as e:
            print(f"Redis connection failed: {e}. Running without cache.")
            self.client = None
            self._enabled = False

    async def disconnect(self) -> None:
        if self.client is not None:
            await self.client.aclose()
            self.client = None

    def _require(self) -> redis.Redis | None:
        return self.client

    async def get(self, key: str) -> str | None:
        if not self._enabled or self.client is None:
            return None
        return await self.client.get(key)

    async def set(self, key: str, value: str, ex: int | None = 3600) -> bool:
        if not self._enabled or self.client is None:
            return False
        return bool(await self.client.set(name=key, value=value, ex=ex))

    async def delete(self, key: str) -> int:
        if not self._enabled or self.client is None:
            return 0
        return int(await self.client.delete(key))

    async def set_json(self, key: str, value: dict[str, Any], ex: int | None = 3600) -> bool:
        return await self.set(key, json.dumps(value), ex=ex)

    async def get_json(self, key: str) -> dict[str, Any] | None:
        raw = await self.get(key)
        if raw is None:
            return None
        return json.loads(raw)


redis_client = RedisClient(settings.redis_url)

