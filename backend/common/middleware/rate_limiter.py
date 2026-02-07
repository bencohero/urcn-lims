"""Rate limiting middleware using Redis."""

import time
from typing import Callable, Optional

from fastapi import FastAPI, Request, Response, status
from fastapi.responses import JSONResponse

from common.config import get_settings
from common.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class RateLimiter:
    """
    Redis-based rate limiter using sliding window algorithm.
    Falls back to in-memory limiting if Redis is unavailable.
    """

    def __init__(
        self,
        requests_per_window: int = None,
        window_seconds: int = None,
        redis_client=None,
    ):
        self.requests_per_window = requests_per_window or settings.RATE_LIMIT_REQUESTS
        self.window_seconds = window_seconds or settings.RATE_LIMIT_WINDOW_SECONDS
        self.redis_client = redis_client
        self._memory_store: dict = {}

    def _get_client_key(self, request: Request) -> str:
        """Get a unique key for the client."""
        # Use X-Forwarded-For if behind proxy, otherwise use client host
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        return f"rate_limit:{client_ip}"

    async def _check_redis(self, key: str) -> tuple[bool, int, int]:
        """Check rate limit using Redis."""
        try:
            current_time = int(time.time())
            window_start = current_time - self.window_seconds

            # Use Redis pipeline for atomic operations
            pipe = self.redis_client.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zadd(key, {str(current_time): current_time})
            pipe.zcard(key)
            pipe.expire(key, self.window_seconds)
            results = await pipe.execute()

            request_count = results[2]
            remaining = max(0, self.requests_per_window - request_count)
            reset_time = current_time + self.window_seconds

            if request_count > self.requests_per_window:
                return False, remaining, reset_time

            return True, remaining, reset_time
        except Exception as e:
            logger.warning(f"Redis rate limit error: {e}, falling back to memory")
            return await self._check_memory(key)

    async def _check_memory(self, key: str) -> tuple[bool, int, int]:
        """Check rate limit using in-memory store (fallback)."""
        current_time = time.time()
        window_start = current_time - self.window_seconds

        # Clean old entries
        if key in self._memory_store:
            self._memory_store[key] = [
                ts for ts in self._memory_store[key] if ts > window_start
            ]
        else:
            self._memory_store[key] = []

        # Add current request
        self._memory_store[key].append(current_time)
        request_count = len(self._memory_store[key])
        remaining = max(0, self.requests_per_window - request_count)
        reset_time = int(current_time + self.window_seconds)

        if request_count > self.requests_per_window:
            return False, remaining, reset_time

        return True, remaining, reset_time

    async def check(self, request: Request) -> tuple[bool, int, int]:
        """
        Check if request is within rate limit.

        Returns:
            Tuple of (allowed, remaining_requests, reset_timestamp)
        """
        key = self._get_client_key(request)

        if self.redis_client:
            return await self._check_redis(key)
        else:
            return await self._check_memory(key)


async def rate_limit_middleware(request: Request, call_next: Callable) -> Response:
    """
    Rate limiting middleware.

    Adds headers:
    - X-RateLimit-Limit: Maximum requests per window
    - X-RateLimit-Remaining: Remaining requests
    - X-RateLimit-Reset: Unix timestamp when the window resets
    """
    # Skip rate limiting for health checks
    if request.url.path in ["/health", "/healthz", "/ready"]:
        return await call_next(request)

    limiter = RateLimiter()
    allowed, remaining, reset_time = await limiter.check(request)

    if not allowed:
        logger.warning(
            "Rate limit exceeded",
            client=request.client.host if request.client else "unknown",
            path=request.url.path,
        )
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "success": False,
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests. Please try again later.",
                    "details": {"retry_after": reset_time - int(time.time())},
                },
            },
            headers={
                "X-RateLimit-Limit": str(limiter.requests_per_window),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_time),
                "Retry-After": str(reset_time - int(time.time())),
            },
        )

    response = await call_next(request)

    # Add rate limit headers to response
    response.headers["X-RateLimit-Limit"] = str(limiter.requests_per_window)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_time)

    return response


def setup_rate_limiter(app: FastAPI) -> None:
    """
    Setup rate limiting middleware.

    Args:
        app: FastAPI application instance
    """
    app.middleware("http")(rate_limit_middleware)
