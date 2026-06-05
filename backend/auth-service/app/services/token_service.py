"""Token management service."""

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from common.auth.jwt import TokenPayload
from common.config import get_settings
from common.models import User
from common.models.site_user import SiteUser
from common.utils.logger import get_logger

logger = get_logger(__name__)
settings = get_settings()


class TokenService:
    """Service for token management."""

    TOKEN_BLACKLIST_PREFIX = "auth:token:blacklist:"
    USER_REVOKED_AFTER_PREFIX = "auth:user:revoked_after:"

    def __init__(self, db: AsyncSession, redis_client: Redis):
        self.db = db
        self.redis_client = redis_client

    @classmethod
    def _blacklist_key(cls, jti: str) -> str:
        return f"{cls.TOKEN_BLACKLIST_PREFIX}{jti}"

    @classmethod
    def _user_revoked_after_key(cls, user_id: UUID) -> str:
        return f"{cls.USER_REVOKED_AFTER_PREFIX}{user_id}"

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID with roles and sites loaded."""
        query = (
            select(User)
            .where(User.id == user_id)
            .options(
                selectinload(User.site_users).selectinload(SiteUser.role),
                selectinload(User.site_users).selectinload(SiteUser.site),
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def invalidate_user_tokens(self, user_id: UUID) -> None:
        """Invalidate all tokens issued to a user before this call."""
        revoked_after = datetime.now(timezone.utc).timestamp()
        ttl_seconds = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

        await self.redis_client.set(
            self._user_revoked_after_key(user_id),
            str(revoked_after),
            ex=ttl_seconds,
        )
        logger.info("Tokens invalidated", user_id=str(user_id))

    async def is_token_blacklisted(self, jti: str) -> bool:
        """Return whether a token JTI is blacklisted."""
        return bool(await self.redis_client.exists(self._blacklist_key(jti)))

    async def blacklist_token(self, jti: str, expires_at: datetime) -> None:
        """Blacklist one token until its natural expiration."""
        now = datetime.now(timezone.utc)
        expiry = expires_at
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)

        ttl_seconds = max(0, int((expiry - now).total_seconds()))
        if ttl_seconds == 0:
            return

        await self.redis_client.set(
            self._blacklist_key(jti),
            "1",
            ex=ttl_seconds,
        )

    async def is_token_revoked(self, payload: TokenPayload) -> bool:
        """Check individual and user-wide token revocation state."""
        if payload.jti and await self.is_token_blacklisted(payload.jti):
            return True

        try:
            user_id = UUID(payload.sub)
        except ValueError:
            return True

        revoked_after = await self.redis_client.get(
            self._user_revoked_after_key(user_id)
        )
        if revoked_after is None:
            return False

        issued_at = payload.iat
        if issued_at.tzinfo is None:
            issued_at = issued_at.replace(tzinfo=timezone.utc)

        try:
            return issued_at.timestamp() <= float(revoked_after)
        except (TypeError, ValueError):
            logger.warning(
                "Invalid token revocation timestamp",
                user_id=str(user_id),
            )
            return True
