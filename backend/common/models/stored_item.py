"""
StoredItem model - base model for all stored items (polymorphic).
"""

import uuid
from datetime import date
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .container import Container
    from .movement import Movement
    from .site import Site
    from .study import Study


class StoredItem(BaseModel):
    """
    Base model for all stored items using joined table inheritance.
    Documents, Equipment, and Consumables inherit from this.
    """

    __tablename__ = "stored_items"

    # Polymorphic discriminator
    item_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # DOCUMENT, EQUIPMENT, CONSUMABLE

    __mapper_args__ = {
        "polymorphic_identity": "stored_item",
        "polymorphic_on": item_type,
    }

    # Foreign keys
    study_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("studies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    container_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("containers.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Item info
    internal_code: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    unit: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # UNIT, BOX, PACK

    # Status: IN_STORAGE, IN_USE, OUT, ARCHIVED, DESTROYED
    status: Mapped[str] = mapped_column(
        String(50), default="IN_STORAGE", nullable=False, index=True
    )

    # Dates
    storage_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_retention_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Condition: GOOD, FAIR, DAMAGED
    physical_condition: Mapped[str] = mapped_column(
        String(50), default="GOOD", nullable=False
    )

    # Location notes
    location_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    study: Mapped["Study"] = relationship("Study", back_populates="stored_items")
    site: Mapped["Site"] = relationship("Site", back_populates="stored_items")
    container: Mapped[Optional["Container"]] = relationship(
        "Container", back_populates="stored_items"
    )
    movements: Mapped[List["Movement"]] = relationship(
        "Movement", back_populates="stored_item", lazy="selectin"
    )

    @property
    def location(self):
        return self.container.location if self.container else None

    @property
    def is_available(self) -> bool:
        return self.status == "IN_STORAGE"

    @property
    def is_out(self) -> bool:
        return self.status in ("IN_USE", "OUT")

    def __repr__(self) -> str:
        return f"<StoredItem(id={self.id}, type={self.item_type})>"
