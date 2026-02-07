"""
Equipment model - inherits from StoredItem.
"""

import uuid
from datetime import date
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .stored_item import StoredItem


class Equipment(StoredItem):
    """Equipment stored item (analyzers, centrifuges, etc.)."""

    __tablename__ = "equipment"

    __mapper_args__ = {
        "polymorphic_identity": "EQUIPMENT",
    }

    # Primary key (same as stored_item)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stored_items.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Equipment type: ANALYZER, CENTRIFUGE, REFRIGERATOR, etc.
    equipment_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Manufacturer info
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )

    # Calibration
    calibration_required: Mapped[bool] = mapped_column(Boolean, default=False)
    last_calibration_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_calibration_date: Mapped[Optional[date]] = mapped_column(
        Date, nullable=True, index=True
    )

    # Maintenance
    maintenance_schedule: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    last_maintenance_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Warranty
    warranty_expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Purchase info
    purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    purchase_cost: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    currency: Mapped[str] = mapped_column(String(10), default="EUR")

    # Operational status: OPERATIONAL, MAINTENANCE, DEFECTIVE, RETIRED
    operational_status: Mapped[str] = mapped_column(
        String(50), default="OPERATIONAL", index=True
    )

    # Additional equipment metadata
    equipment_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    @property
    def is_operational(self) -> bool:
        return self.operational_status == "OPERATIONAL"

    @property
    def needs_calibration(self) -> bool:
        if not self.calibration_required or not self.next_calibration_date:
            return False
        return date.today() >= self.next_calibration_date

    def __repr__(self) -> str:
        return f"<Equipment(id={self.id}, type={self.equipment_type}, serial={self.serial_number})>"
