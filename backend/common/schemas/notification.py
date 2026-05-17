"""Notification schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import AliasChoices, Field

from .base import BaseSchema, IDTimestampSchema


class NotificationBase(BaseSchema):
    """Base notification schema."""

    notification_type: str = Field(max_length=50)
    title: str = Field(max_length=255)
    message: str
    priority: str = Field(default="NORMAL", pattern="^(LOW|NORMAL|HIGH|CRITICAL)$")
    channel: str = Field(default="IN_APP", pattern="^(IN_APP|EMAIL|SMS)$")


class NotificationResponse(IDTimestampSchema, NotificationBase):
    """Notification response schema."""

    user_id: UUID
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[UUID] = None
    is_read: bool
    read_at: Optional[datetime] = None
    sent_at: datetime
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("meta_data", "metadata"),
    )


class NotificationListResponse(BaseSchema):
    """Response for notification list with unread count."""

    items: list[NotificationResponse]
    unread_count: int
    pagination: Dict[str, int]


class NotificationMarkAllReadResponse(BaseSchema):
    """Response for mark all as read."""

    marked_count: int
