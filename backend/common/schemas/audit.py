"""Audit trail schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema


class UserSummary(BaseSchema):
    """User summary for audit response."""

    id: UUID
    username: str
    full_name: str


class AuditTrailResponse(BaseSchema):
    """Audit trail response schema."""

    id: UUID
    event_type: str
    table_name: Optional[str]
    record_id: Optional[UUID]
    user: Optional[UserSummary]
    action: str
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    site_id: Optional[UUID]
    timestamp: datetime
    hash_current: str


class AuditTrailQuery(BaseSchema):
    """Query parameters for audit trail."""

    user_id: Optional[UUID] = None
    event_type: Optional[str] = None
    table_name: Optional[str] = None
    record_id: Optional[UUID] = None
    from_timestamp: Optional[datetime] = None
    to_timestamp: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=100, ge=1, le=500)


class IntegrityVerificationResult(BaseSchema):
    """Result of audit trail integrity verification."""

    total_records_checked: int
    integrity_valid: bool
    broken_chain_detected: bool
    details: Dict[str, Any]
