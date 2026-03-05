"""
Redis connection pool management.
"""
import aioredis

from app.config import get_settings


settings = get_settings()


# Create Redis connection pool
redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Get Redis connection from pool."""
    global redis_pool
    
    if redis_pool is None:
        redis_pool = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
    
    return redis_pool


async def close_redis():
    """Close Redis connection pool."""
    global redis_pool
    
    if redis_pool:
        await redis_pool.close()
        redis_pool = None
