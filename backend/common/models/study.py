"""
Study model for clinical trials.
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .site import Site
    from .stored_item import StoredItem


class Study(BaseModel):
    """Clinical study/trial model."""

    __tablename__ = "studies"

    protocol_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    sponsor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phase: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    therapeutic_area: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Dates
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Enrollment
    estimated_enrollment: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Status: ACTIVE, PAUSED, COMPLETED, CANCELLED
    status: Mapped[str] = mapped_column(
        String(50), default="ACTIVE", nullable=False, index=True
    )

    # Retention
    retention_period_years: Mapped[int] = mapped_column(Integer, default=10)

    # Additional info
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Audit
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    sites: Mapped[List["Site"]] = relationship(
        "Site", back_populates="study", lazy="selectin"
    )
    stored_items: Mapped[List["StoredItem"]] = relationship(
        "StoredItem", back_populates="study", lazy="noload"
    )

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    @property
    def sites_count(self) -> int:
        return len(self.sites)

    def __repr__(self) -> str:
        return f"<Study(id={self.id}, protocol={self.protocol_number})>"
