"""
Document model - inherits from StoredItem.
"""

import uuid
from datetime import date
from typing import Any, Dict, Optional

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from .stored_item import StoredItem


class Document(StoredItem):
    """Document stored item (forms, consent, CRF, etc.)."""

    __tablename__ = "documents"

    __mapper_args__ = {
        "polymorphic_identity": "DOCUMENT",
    }

    # Primary key (same as stored_item)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stored_items.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Document type: CONSENT, CRF, SOURCE_DOC, LAB_REPORT, etc.
    document_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Subject/Patient info
    subject_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True, index=True
    )
    visit_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Form details
    form_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    original_language: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)

    # Signature
    signature_required: Mapped[bool] = mapped_column(Boolean, default=False)
    signed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Classification
    confidentiality_level: Mapped[str] = mapped_column(
        String(50), default="HIGH", index=True
    )  # LOW, MEDIUM, HIGH, CRITICAL
    retention_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Additional document metadata
    document_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=True
    )

    def __repr__(self) -> str:
        return f"<Document(id={self.id}, type={self.document_type}, subject={self.subject_id})>"
