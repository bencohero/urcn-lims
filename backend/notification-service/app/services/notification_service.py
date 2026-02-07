"""Notification service."""

from datetime import datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import Notification, User
from common.utils.logger import get_logger

logger = get_logger(__name__)


class NotificationService:
    """Service for notification management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_notifications(
        self,
        user_id: UUID,
        is_read: Optional[bool] = None,
        notification_type: Optional[str] = None,
        from_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Notification], int, int]:
        """
        Get notifications for a user.

        Returns:
            Tuple of (notifications, total_count, unread_count)
        """
        query = select(Notification).where(Notification.user_id == user_id)

        filters = [Notification.user_id == user_id]
        if is_read is not None:
            filters.append(Notification.is_read == is_read)
        if notification_type:
            filters.append(Notification.notification_type == notification_type)
        if from_date:
            filters.append(Notification.sent_at >= datetime.fromisoformat(from_date))

        query = query.where(and_(*filters))

        # Total count
        count_query = select(func.count()).select_from(Notification).where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Unread count
        unread_query = (
            select(func.count())
            .select_from(Notification)
            .where(and_(Notification.user_id == user_id, Notification.is_read == False))
        )
        unread_result = await self.db.execute(unread_query)
        unread_count = unread_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Notification.sent_at.desc())

        result = await self.db.execute(query)
        notifications = result.scalars().all()

        return notifications, total, unread_count

    async def get_notification_by_id(
        self, notification_id: UUID, user_id: UUID
    ) -> Optional[Notification]:
        """Get notification by ID for a specific user."""
        query = select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_notification(
        self,
        user_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "NORMAL",
        channel: str = "IN_APP",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[UUID] = None,
    ) -> Notification:
        """Create a new notification."""
        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=priority,
            channel=channel,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            sent_at=datetime.utcnow(),
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)

        logger.info(
            "Notification created",
            notification_id=str(notification.id),
            user_id=str(user_id),
            type=notification_type,
        )

        return notification

    async def mark_as_read(
        self, notification_id: UUID, user_id: UUID
    ) -> Optional[Notification]:
        """Mark notification as read."""
        notification = await self.get_notification_by_id(notification_id, user_id)
        if not notification:
            return None

        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(notification)

        return notification

    async def mark_all_as_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for a user."""
        stmt = (
            update(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False,
                )
            )
            .values(is_read=True, read_at=datetime.utcnow())
        )
        result = await self.db.execute(stmt)
        await self.db.commit()

        count = result.rowcount
        logger.info(
            "All notifications marked as read",
            user_id=str(user_id),
            count=count,
        )

        return count

    async def get_unread_count(self, user_id: UUID) -> int:
        """Get count of unread notifications."""
        query = (
            select(func.count())
            .select_from(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False,
                )
            )
        )
        result = await self.db.execute(query)
        return result.scalar()

    async def send_to_role(
        self,
        role_code: str,
        site_id: UUID,
        notification_type: str,
        title: str,
        message: str,
        priority: str = "NORMAL",
        related_entity_type: Optional[str] = None,
        related_entity_id: Optional[UUID] = None,
    ) -> List[Notification]:
        """Send notification to all users with a specific role at a site."""
        # Get users with the role at the site
        from common.models import SiteUser, Role

        query = (
            select(SiteUser.user_id)
            .join(Role)
            .where(
                and_(
                    SiteUser.site_id == site_id,
                    Role.code == role_code,
                )
            )
        )
        result = await self.db.execute(query)
        user_ids = result.scalars().all()

        notifications = []
        for user_id in user_ids:
            notification = await self.create_notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                priority=priority,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
            )
            notifications.append(notification)

        logger.info(
            "Notifications sent to role",
            role_code=role_code,
            site_id=str(site_id),
            count=len(notifications),
        )

        return notifications
