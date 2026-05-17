"""Movement schemas."""

from datetime import date, datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import AliasChoices, Field

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
    performed_by_id: Optional[UUID] = None
    from_container_id: Optional[UUID] = None
    to_container_id: Optional[UUID] = None
    from_location_id: Optional[UUID] = None
    to_location_id: Optional[UUID] = None
    related_access_request_id: Optional[UUID] = None


class UserSummary(BaseSchema):
    """User summary for movement response."""

    id: UUID
    name: str = Field(validation_alias=AliasChoices("name", "full_name"))


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


class StoredItemDetail(BaseSchema):
    """Full stored item for movement response — covers all concrete types."""

    id: UUID
    item_type: str
    status: str
    description: Optional[str] = None
    internal_code: Optional[str] = None
    container: Optional[ContainerSummary] = None
    location: Optional[LocationSummary] = None
    # Document fields
    document_type: Optional[str] = None
    subject_id: Optional[str] = None
    visit_number: Optional[str] = None
    form_name: Optional[str] = None
    version: Optional[str] = None
    page_count: Optional[int] = None
    confidentiality_level: Optional[str] = None
    # Equipment fields
    equipment_type: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial_number: Optional[str] = None
    operational_status: Optional[str] = None
    # Consumable fields
    consumable_type: Optional[str] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[date] = None
    catalog_number: Optional[str] = None
    hazardous: Optional[bool] = None


class MovementResponse(IDTimestampSchema, MovementBase):
    """Movement response schema."""

    stored_item_id: UUID
    stored_item: Optional[StoredItemDetail] = None
    movement_date: datetime
    actual_return_date: Optional[date] = None
    performed_by: UserSummary = Field(
        validation_alias=AliasChoices("performer", "performed_by")
    )
    approved_by: Optional[UserSummary] = Field(
        default=None,
        validation_alias=AliasChoices("approver", "approved_by"),
    )
    from_container: Optional[ContainerSummary] = None
    to_container: Optional[ContainerSummary] = None
    from_location: Optional[LocationSummary] = None
    to_location: Optional[LocationSummary] = None
    related_access_request_id: Optional[UUID] = None
    is_return_overdue: bool = False
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("meta_data", "metadata"),
    )
