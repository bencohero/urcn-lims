"""Tests for Redis-backed token revocation."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from common.auth.jwt import TokenPayload, create_access_token, decode_token
from app.services.token_service import TokenService, settings


@pytest.fixture
def redis_client():
    client = AsyncMock()
    client.exists.return_value = 0
    client.get.return_value = None
    return client


@pytest.fixture
def service(redis_client):
    return TokenService(AsyncMock(), redis_client)


@pytest.mark.asyncio
async def test_invalidate_user_tokens_sets_revocation_timestamp(
    service, redis_client
):
    user_id = uuid4()

    await service.invalidate_user_tokens(user_id)

    key, value = redis_client.set.call_args.args
    assert key == f"auth:user:revoked_after:{user_id}"
    assert float(value) <= datetime.now(timezone.utc).timestamp()
    assert redis_client.set.call_args.kwargs["ex"] == (
        settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )


@pytest.mark.asyncio
async def test_is_token_blacklisted_uses_jti_key(service, redis_client):
    redis_client.exists.return_value = 1

    assert await service.is_token_blacklisted("token-jti") is True
    redis_client.exists.assert_awaited_once_with(
        "auth:token:blacklist:token-jti"
    )


@pytest.mark.asyncio
async def test_blacklist_token_uses_remaining_lifetime(service, redis_client):
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    await service.blacklist_token("token-jti", expires_at)

    redis_client.set.assert_awaited_once()
    assert redis_client.set.call_args.args == (
        "auth:token:blacklist:token-jti",
        "1",
    )
    assert 295 <= redis_client.set.call_args.kwargs["ex"] <= 300


@pytest.mark.asyncio
async def test_is_token_revoked_when_jti_is_blacklisted(service, redis_client):
    redis_client.exists.return_value = 1
    payload = TokenPayload(
        sub=str(uuid4()),
        exp=datetime.now(timezone.utc) + timedelta(minutes=5),
        iat=datetime.now(timezone.utc),
        type="access",
        jti="blocked-jti",
    )

    assert await service.is_token_revoked(payload) is True
    redis_client.get.assert_not_awaited()


@pytest.mark.asyncio
async def test_is_token_revoked_after_user_invalidation(service, redis_client):
    issued_at = datetime.now(timezone.utc) - timedelta(minutes=1)
    redis_client.get.return_value = str(datetime.now(timezone.utc).timestamp())
    payload = TokenPayload(
        sub=str(uuid4()),
        exp=datetime.now(timezone.utc) + timedelta(minutes=5),
        iat=issued_at,
        type="refresh",
        jti="refresh-jti",
    )

    assert await service.is_token_revoked(payload) is True


@pytest.mark.asyncio
async def test_new_token_is_not_revoked(service, redis_client):
    issued_at = datetime.now(timezone.utc)
    redis_client.get.return_value = str(
        (issued_at - timedelta(seconds=1)).timestamp()
    )
    payload = TokenPayload(
        sub=str(uuid4()),
        exp=issued_at + timedelta(minutes=5),
        iat=issued_at,
        type="refresh",
        jti="refresh-jti",
    )

    assert await service.is_token_revoked(payload) is False


def test_access_tokens_include_unique_jti():
    user_id = uuid4()

    first = decode_token(create_access_token(user_id))
    second = decode_token(create_access_token(user_id))

    assert first is not None and first.jti is not None
    assert second is not None and second.jti is not None
    assert first.jti != second.jti
