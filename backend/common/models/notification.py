"""
Notification model for user notifications.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel


class Notification(BaseModel):
    """User notification model."""

    __tablename__ = "notifications"

    # Foreign keys
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Notification type
    notification_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # ACCESS_REQUEST, APPROVAL, OVERDUE, ALERT, etc.

    # Content
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)

    # Priority: LOW, NORMAL, HIGH, CRITICAL
    priority: Mapped[str] = mapped_column(String(50), default="NORMAL", nullable=False)

    # Channel: IN_APP, EMAIL, SMS
    channel: Mapped[str] = mapped_column(String(50), default="IN_APP", nullable=False)

    # Related entity
    related_entity_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # ACCESS_REQUEST, MOVEMENT, etc.
    related_entity_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )

    # Read status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Sent status
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])

    def mark_as_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True
        self.read_at = datetime.utcnow()

    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.notification_type}, user={self.user_id})>"
