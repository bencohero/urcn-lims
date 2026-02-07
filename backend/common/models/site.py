"""
Site model for clinical trial sites.
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Boolean, Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .site_user import SiteUser
    from .storage_location import StorageLocation
    from .stored_item import StoredItem
    from .study import Study
    from .user import User


class Site(BaseModel):
    """Clinical trial site model."""

    __tablename__ = "sites"
    __table_args__ = (
        UniqueConstraint("study_id", "site_number", name="uq_sites_study_site_number"),
    )

    # Foreign keys
    study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    principal_investigator_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Site info
    site_number: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Location
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Contact
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Status: ACTIVE, INACTIVE, CLOSED
    status: Mapped[str] = mapped_column(
        String(50), default="ACTIVE", nullable=False, index=True
    )

    # Dates
    activation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    closure_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Features
    has_offline_capability: Mapped[bool] = mapped_column(Boolean, default=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Audit
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    study: Mapped["Study"] = relationship("Study", back_populates="sites")
    principal_investigator: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[principal_investigator_id]
    )
    site_users: Mapped[List["SiteUser"]] = relationship(
        "SiteUser", back_populates="site", lazy="selectin"
    )
    storage_locations: Mapped[List["StorageLocation"]] = relationship(
        "StorageLocation", back_populates="site", lazy="selectin"
    )
    stored_items: Mapped[List["StoredItem"]] = relationship(
        "StoredItem", back_populates="site", lazy="noload"
    )

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    def __repr__(self) -> str:
        return f"<Site(id={self.id}, site_number={self.site_number})>"
