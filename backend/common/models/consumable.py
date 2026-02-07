"""
Consumable model - inherits from StoredItem.
"""

import uuid
from datetime import date
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .stored_item import StoredItem


class Consumable(StoredItem):
    """Consumable stored item (reagents, tubes, syringes, etc.)."""

    __tablename__ = "consumables"

    __mapper_args__ = {
        "polymorphic_identity": "CONSUMABLE",
    }

    # Primary key (same as stored_item)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stored_items.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Consumable type: REAGENT, TUBE, SYRINGE, etc.
    consumable_type: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )

    # Product info
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    catalog_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    lot_number: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )

    # Expiry
    expiry_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True, index=True
    )

    # Storage requirements
    storage_conditions: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # Ex: "2-8°C, protect from light"

    # Hazard info
    hazardous: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    hazard_classification: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # Ex: "H315, H319"

    # Stock management
    minimum_stock_level: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reorder_point: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Additional consumable metadata
    consumable_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    @property
    def is_expired(self) -> bool:
        if not self.expiry_date:
            return False
        return date.today() > self.expiry_date

    @property
    def is_low_stock(self) -> bool:
        if not self.minimum_stock_level:
            return False
        from .stored_item import StoredItem

        return self.quantity <= self.minimum_stock_level

    @property
    def needs_reorder(self) -> bool:
        if not self.reorder_point:
            return False
        return self.quantity <= self.reorder_point

    def __repr__(self) -> str:
        return f"<Consumable(id={self.id}, type={self.consumable_type}, lot={self.lot_number})>"
