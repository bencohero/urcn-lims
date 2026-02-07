"""
AuditTrail model for immutable audit logging.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import INET, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from common.database.base import Base


class AuditTrail(Base):
    """
    Immutable audit trail for compliance.
    This table is append-only with hash chaining for integrity verification.
    Note: Does not inherit from BaseModel to avoid updated_at trigger.
    """

    __tablename__ = "audit_trail"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Event type: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Target
    table_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    record_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )

    # User (denormalized for historical record)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Action description
    action: Mapped[str] = mapped_column(String(255), nullable=False)

    # Data changes
    old_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    # Context
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    site_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="SET NULL"),
        nullable=True,
    )
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Reason for action
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Timestamp (immutable)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
        index=True,
    )

    # Hash chain for integrity
    hash_previous: Mapped[Optional[str]] = mapped_column(
        String(64), nullable=True
    )  # SHA-256 of previous record
    hash_current: Mapped[str] = mapped_column(
        String(64), nullable=False
    )  # SHA-256 of this record

    # Additional info
    meta_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return f"<AuditTrail(id={self.id}, event={self.event_type}, table={self.table_name})>"
