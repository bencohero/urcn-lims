"""
StorageLocation model for physical storage areas.
"""

import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Boolean, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .container import Container
    from .site import Site


class StorageLocation(BaseModel):
    """Physical storage location (room, zone, area)."""

    __tablename__ = "storage_locations"

    # Foreign keys
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Self-referential for hierarchy
    parent_location_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("storage_locations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Location info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Type: ROOM, ZONE, AREA
    location_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Physical location
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    floor: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    building: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Environmental controls
    temperature_controlled: Mapped[bool] = mapped_column(Boolean, default=False)
    temperature_min: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    temperature_max: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 2), nullable=True
    )
    humidity_controlled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Access
    access_restricted: Mapped[bool] = mapped_column(Boolean, default=False)

    # Capacity
    capacity_cubic_meters: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    current_usage_percent: Mapped[float] = mapped_column(
        Numeric(5, 2), default=0.0, nullable=False
    )

    # Status: ACTIVE, MAINTENANCE, CLOSED
    status: Mapped[str] = mapped_column(
        String(50), default="ACTIVE", nullable=False, index=True
    )

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
    site: Mapped["Site"] = relationship("Site", back_populates="storage_locations")
    parent: Mapped[Optional["StorageLocation"]] = relationship(
        "StorageLocation",
        back_populates="children",
        remote_side="StorageLocation.id",
    )
    children: Mapped[List["StorageLocation"]] = relationship(
        "StorageLocation", back_populates="parent", lazy="selectin"
    )
    containers: Mapped[List["Container"]] = relationship(
        "Container", back_populates="location", lazy="selectin"
    )

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    @property
    def full_path(self) -> str:
        """Get full hierarchical path of location."""
        parts = [self.name]
        parent = self.parent
        while parent:
            parts.insert(0, parent.name)
            parent = parent.parent
        return " > ".join(parts)

    def __repr__(self) -> str:
        return f"<StorageLocation(id={self.id}, name={self.name})>"
