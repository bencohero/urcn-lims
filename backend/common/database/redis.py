from fastapi import Request
from redis.asyncio import Redis


def get_redis(request: Request) -> Redis:
    """Return the Redis client initialized by the current application."""
    return request.app.state.redis
