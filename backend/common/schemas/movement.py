"""Movement schemas."""

from datetime import date, datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema, IDTimestampSchema


class MovementBase(BaseSchema):
    """Base movement schema."""

    movement_type: str = Field(
        pattern="^(IN|OUT|TRANSFER|RETURN|ARCHIVE|DESTROY)$"
    )
    quantity: int = Field(default=1, ge=1)
    reason: Optional[str] = Field(default=None, max_length=255)
    expected_return_date: Optional[date] = None
    notes: Optional[str] = None


class MovementCreate(MovementBase):
    """Schema for creating a movement."""

    stored_item_id: UUID
    from_container_id: Optional[UUID] = None
    to_container_id: Optional[UUID] = None
    from_location_id: Optional[UUID] = None
    to_location_id: Optional[UUID] = None
    related_access_request_id: Optional[UUID] = None


class UserSummary(BaseSchema):
    """User summary for movement response."""

    id: UUID
    name: str


class ContainerSummary(BaseSchema):
    """Container summary for movement response."""

    id: UUID
    name: str
    code: Optional[str]


class LocationSummary(BaseSchema):
    """Location summary for movement response."""

    id: UUID
    name: str
    code: Optional[str]


class MovementResponse(IDTimestampSchema, MovementBase):
    """Movement response schema."""

    stored_item_id: UUID
    movement_date: datetime
    actual_return_date: Optional[date] = None
    performed_by: UserSummary
    approved_by: Optional[UserSummary] = None
    from_container: Optional[ContainerSummary] = None
    to_container: Optional[ContainerSummary] = None
    from_location: Optional[LocationSummary] = None
    to_location: Optional[LocationSummary] = None
    related_access_request_id: Optional[UUID] = None
    is_return_overdue: bool = False
    metadata: Optional[Dict[str, Any]] = None
