"""Audit trail schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field, model_validator

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
    user: Optional[UserSummary] = None
    action: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    site_id: Optional[UUID] = None
    timestamp: datetime
    hash_current: str

    @model_validator(mode='before')
    @classmethod
    def build_user_from_denormalized(cls, data):
        """Build UserSummary from denormalized user fields on the ORM object."""
        if not isinstance(data, dict):
            user_id = getattr(data, 'user_id', None)
            username = getattr(data, 'username', None)
            full_name = getattr(data, 'user_full_name', None)
            if user_id and username:
                data.__dict__['user'] = {
                    'id': str(user_id),
                    'username': username,
                    'full_name': full_name or username,
                }
        return data


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
