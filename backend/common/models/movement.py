"""
Movement model for tracking physical movements of items.
"""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any, Dict, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .container import Container
    from .storage_location import StorageLocation
    from .stored_item import StoredItem
    from .user import User


class Movement(BaseModel):
    """Track physical movements of stored items."""

    __tablename__ = "movements"

    # Foreign keys
    stored_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stored_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    from_container_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("containers.id", ondelete="SET NULL"),
        nullable=True,
    )
    to_container_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("containers.id", ondelete="SET NULL"),
        nullable=True,
    )
    from_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    to_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True,
    )
    performed_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    related_access_request_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )

    # Movement type: IN, OUT, TRANSFER, RETURN, ARCHIVE, DESTROY
    movement_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )

    # Quantity moved
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Reason for movement
    reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Return tracking
    expected_return_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_return_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Timestamps
    movement_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )

    # Notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Relationships
    stored_item: Mapped["StoredItem"] = relationship(
        "StoredItem", back_populates="movements"
    )
    from_container: Mapped[Optional["Container"]] = relationship(
        "Container", foreign_keys=[from_container_id]
    )
    to_container: Mapped[Optional["Container"]] = relationship(
        "Container", foreign_keys=[to_container_id]
    )
    from_location: Mapped[Optional["StorageLocation"]] = relationship(
        "StorageLocation", foreign_keys=[from_location_id]
    )
    to_location: Mapped[Optional["StorageLocation"]] = relationship(
        "StorageLocation", foreign_keys=[to_location_id]
    )
    performer: Mapped["User"] = relationship("User", foreign_keys=[performed_by])
    approver: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[approved_by]
    )

    @property
    def is_outgoing(self) -> bool:
        return self.movement_type in ("OUT", "TRANSFER")

    @property
    def is_return_overdue(self) -> bool:
        if not self.expected_return_date or self.actual_return_date:
            return False
        return date.today() > self.expected_return_date

    def __repr__(self) -> str:
        return f"<Movement(id={self.id}, type={self.movement_type})>"
