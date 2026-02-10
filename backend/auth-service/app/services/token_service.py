"""Token management service."""

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import User
from common.models.site_user import SiteUser
from common.utils.logger import get_logger

logger = get_logger(__name__)


class TokenService:
    """Service for token management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """
        Get user by ID with roles and sites loaded.

        Args:
            user_id: User UUID

        Returns:
            User if found, None otherwise
        """
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
        """
        Invalidate all tokens for a user.
        This would typically add token JTIs to a blacklist in Redis.

        Args:
            user_id: User UUID
        """
        # TODO: Implement token blacklist using Redis
        logger.info("Tokens invalidated", user_id=str(user_id))

    async def is_token_blacklisted(self, jti: str) -> bool:
        """
        Check if a token is blacklisted.

        Args:
            jti: JWT ID

        Returns:
            True if blacklisted
        """
        # TODO: Check Redis blacklist
        return False
