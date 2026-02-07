"""
Container model for physical storage containers.
"""

import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .storage_location import StorageLocation
    from .stored_item import StoredItem


class Container(BaseModel):
    """Physical container (cabinet, shelf, drawer, box)."""

    __tablename__ = "containers"

    # Foreign keys
    location_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("storage_locations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Self-referential for nested containers
    parent_container_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("containers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Type: CABINET, SHELF, DRAWER, BOX
    container_type: Mapped[str] = mapped_column(String(50), nullable=False)

    # Info
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Capacity
    capacity_items: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    current_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Physical properties
    dimensions_cm: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # Format: "LxWxH"
    material: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Security
    locked: Mapped[bool] = mapped_column(Boolean, default=False)
    barcode: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Status: ACTIVE, MAINTENANCE, RETIRED
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
    location: Mapped["StorageLocation"] = relationship(
        "StorageLocation", back_populates="containers"
    )
    parent: Mapped[Optional["Container"]] = relationship(
        "Container",
        back_populates="children",
        remote_side="Container.id",
    )
    children: Mapped[List["Container"]] = relationship(
        "Container", back_populates="parent", lazy="selectin"
    )
    stored_items: Mapped[List["StoredItem"]] = relationship(
        "StoredItem", back_populates="container", lazy="noload"
    )

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    @property
    def usage_percent(self) -> float:
        if not self.capacity_items or self.capacity_items == 0:
            return 0.0
        return (self.current_count / self.capacity_items) * 100

    @property
    def is_full(self) -> bool:
        if not self.capacity_items:
            return False
        return self.current_count >= self.capacity_items

    def __repr__(self) -> str:
        return f"<Container(id={self.id}, name={self.name})>"
