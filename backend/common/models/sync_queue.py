"""
SyncQueue model for offline synchronization.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class SyncQueue(BaseModel):
    """Queue for offline synchronization actions."""

    __tablename__ = "sync_queue"

    # Foreign keys
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    site_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Action type: CREATE, UPDATE, DELETE
    action_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Target
    table_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    record_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )

    # Payload
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # Timestamps
    client_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    server_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Status: PENDING, PROCESSED, FAILED, CONFLICT
    status: Mapped[str] = mapped_column(
        String(50), default="PENDING", nullable=False, index=True
    )

    # Retry
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Conflict resolution: LAST_WRITE_WINS, MANUAL, SERVER_WINS, CLIENT_WINS
    conflict_resolution: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Processing
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    @property
    def is_pending(self) -> bool:
        return self.status == "PENDING"

    @property
    def has_conflict(self) -> bool:
        return self.status == "CONFLICT"

    def mark_processed(self) -> None:
        """Mark as processed."""
        self.status = "PROCESSED"
        self.processed_at = datetime.utcnow()

    def mark_failed(self, error: str) -> None:
        """Mark as failed with error."""
        self.status = "FAILED"
        self.last_error = error
        self.retry_count += 1

    def mark_conflict(self, resolution: str = None) -> None:
        """Mark as conflict."""
        self.status = "CONFLICT"
        if resolution:
            self.conflict_resolution = resolution

    def __repr__(self) -> str:
        return f"<SyncQueue(id={self.id}, action={self.action_type}, status={self.status})>"
