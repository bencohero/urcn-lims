"""
AccessRequest model for document/equipment access workflow.
"""

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .site import Site
    from .stored_item import StoredItem
    from .user import User


class AccessRequestItem(BaseModel):
    """Junction table: links multiple stored items to one access request."""

    __tablename__ = "access_request_items"
    __table_args__ = (
        UniqueConstraint("access_request_id", "stored_item_id", name="uq_access_request_item"),
    )

    access_request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("access_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stored_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stored_items.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    stored_item: Mapped["StoredItem"] = relationship("StoredItem", lazy="selectin")
    access_request: Mapped["AccessRequest"] = relationship(
        "AccessRequest", back_populates="request_items"
    )


class AccessRequest(BaseModel):
    """Access request for stored items workflow."""

    __tablename__ = "access_requests"

    # Auto-generated request number: AR-2026-0001
    request_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )

    # Legacy single-item FK kept nullable for backward compat
    stored_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stored_items.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    requester_site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="RESTRICT"),
        nullable=False,
    )
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Request type: CONSULTATION, COPY, LOAN
    request_type: Mapped[str] = mapped_column(
        String(50), default="CONSULTATION", nullable=False
    )

    # Purpose
    purpose: Mapped[str] = mapped_column(Text, nullable=False)

    # Urgency: LOW, NORMAL, HIGH, CRITICAL
    urgency: Mapped[str] = mapped_column(String(50), default="NORMAL", nullable=False)

    # Status: PENDING, APPROVED, REJECTED, FULFILLED, CANCELLED, OVERDUE, RETURNED
    status: Mapped[str] = mapped_column(
        String(50), default="PENDING", nullable=False, index=True
    )

    # Timestamps
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False, index=True
    )
    required_by_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Review
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Approval details
    approved_duration_days: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )
    actual_access_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    expected_return_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_return_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Extension
    extension_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    extension_approved: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    extension_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Relationships
    request_items: Mapped[List["AccessRequestItem"]] = relationship(
        "AccessRequestItem",
        back_populates="access_request",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    requester: Mapped["User"] = relationship("User", foreign_keys=[requester_id])
    requester_site: Mapped["Site"] = relationship("Site", foreign_keys=[requester_site_id])
    reviewer: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[reviewed_by]
    )

    @property
    def items(self) -> List["StoredItem"]:
        """All stored items linked to this request."""
        return [ri.stored_item for ri in (self.request_items or []) if ri.stored_item]

    @property
    def is_pending(self) -> bool:
        return self.status == "PENDING"

    @property
    def is_approved(self) -> bool:
        return self.status == "APPROVED"

    @property
    def is_overdue(self) -> bool:
        if self.status != "FULFILLED" or not self.expected_return_date:
            return False
        return date.today() > self.expected_return_date and not self.actual_return_date

    @property
    def days_overdue(self) -> int:
        if not self.is_overdue:
            return 0
        return (date.today() - self.expected_return_date).days

    @property
    def hours_pending(self) -> float:
        if not self.is_pending:
            return 0
        delta = datetime.utcnow() - self.requested_at.replace(tzinfo=None)
        return delta.total_seconds() / 3600

    def __repr__(self) -> str:
        return f"<AccessRequest(id={self.id}, number={self.request_number}, status={self.status})>"
