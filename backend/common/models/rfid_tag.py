"""
RFIDTag model for RFID tag management.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class RFIDTag(BaseModel):
    """RFID tag for tracking stored items."""

    __tablename__ = "rfid_tags"

    # Tag identifiers
    epc: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )  # Electronic Product Code
    tid: Mapped[Optional[str]] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )  # Tag Identifier (hardware unique)

    # Tag properties
    tag_type: Mapped[str] = mapped_column(String(50), default="UHF_GEN2")
    user_memory: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Additional encoded data

    # Timestamps
    encoding_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    last_read_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Statistics
    read_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status: ACTIVE, DAMAGED, LOST, RETIRED
    status: Mapped[str] = mapped_column(
        String(50), default="ACTIVE", nullable=False, index=True
    )

    # Generic association to stored item
    associated_item_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    associated_item_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # DOCUMENT, EQUIPMENT, CONSUMABLE

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Audit
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    @property
    def is_associated(self) -> bool:
        return self.associated_item_id is not None

    def record_read(self) -> None:
        """Record a tag read event."""
        self.last_read_date = datetime.utcnow()
        self.read_count += 1

    def __repr__(self) -> str:
        return f"<RFIDTag(id={self.id}, epc={self.epc})>"
