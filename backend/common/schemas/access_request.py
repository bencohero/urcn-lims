"""Access request schemas."""

from datetime import date, datetime
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import AliasChoices, Field

from .base import BaseSchema, IDTimestampSchema


class AccessRequestBase(BaseSchema):
    """Base access request schema."""

    request_type: str = Field(
        default="CONSULTATION", pattern="^(CONSULTATION|COPY|LOAN)$"
    )
    purpose: str = Field(min_length=10, max_length=1000)
    urgency: str = Field(default="NORMAL", pattern="^(LOW|NORMAL|HIGH|CRITICAL)$")
    required_by_date: Optional[date] = None


class AccessRequestCreate(AccessRequestBase):
    """Schema for creating an access request."""

    stored_item_id: UUID
    requester_site_id: UUID


class AccessRequestApprove(BaseSchema):
    """Schema for approving an access request."""

    approved_duration_days: int = Field(default=7, ge=1, le=30)
    review_notes: Optional[str] = None


class AccessRequestReject(BaseSchema):
    """Schema for rejecting an access request."""

    review_notes: str = Field(min_length=10, max_length=1000)


class AccessRequestFulfill(BaseSchema):
    """Schema for marking an access request as fulfilled (item handed out)."""

    actual_access_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


class AccessRequestExtend(BaseSchema):
    """Schema for requesting extension."""

    extension_days: int = Field(ge=1, le=14)
    extension_reason: str = Field(min_length=10, max_length=500)


class AccessRequestReturn(BaseSchema):
    """Schema for recording return."""

    actual_return_date: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


class ItemSummary(BaseSchema):
    """Item summary for access request response."""

    id: UUID
    type: str = Field(validation_alias=AliasChoices("item_type", "type"))
    description: Optional[str]


class UserSummary(BaseSchema):
    """User summary for access request response."""

    id: UUID
    name: str = Field(validation_alias=AliasChoices("name", "full_name"))
    email: str


class SiteSummary(BaseSchema):
    """Site summary for access request response."""

    site_number: str
    name: str


class AccessRequestResponse(IDTimestampSchema, AccessRequestBase):
    """Access request response schema."""

    request_number: str
    status: str
    stored_item_id: UUID
    item: Optional[ItemSummary] = Field(
        default=None,
        validation_alias=AliasChoices("stored_item", "item"),
    )
    requester: UserSummary
    requester_site: SiteSummary
    reviewed_by: Optional[UserSummary] = Field(
        default=None,
        validation_alias=AliasChoices("reviewer", "reviewed_by"),
    )
    requested_at: datetime
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    approved_duration_days: Optional[int] = None
    actual_access_date: Optional[datetime] = None
    expected_return_date: Optional[date] = None
    actual_return_date: Optional[date] = None
    extension_requested: bool = False
    extension_approved: Optional[bool] = None
    extension_days: Optional[int] = None
    hours_pending: float = 0.0
    is_overdue: bool = False
    days_overdue: int = 0
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("meta_data", "metadata"),
    )
