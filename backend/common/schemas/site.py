"""Site schemas."""

from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import AliasChoices, EmailStr, Field

from .base import BaseSchema, IDTimestampSchema


class SiteBase(BaseSchema):
    """Base site schema."""

    site_number: str = Field(max_length=50)
    name: str = Field(max_length=255)
    country: str = Field(max_length=100)
    city: str = Field(max_length=100)
    address: Optional[str] = None
    postal_code: Optional[str] = Field(default=None, max_length=20)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    timezone: str = Field(default="UTC", max_length=50)
    has_offline_capability: bool = False


class SiteCreate(SiteBase):
    """Schema for creating a site."""

    study_id: UUID
    principal_investigator_id: Optional[UUID] = None
    activation_date: Optional[date] = None
    status: str = Field(default="ACTIVE", pattern="^(ACTIVE|INACTIVE|CLOSED)$")


class SiteUpdate(BaseSchema):
    """Schema for updating a site."""

    name: Optional[str] = Field(default=None, max_length=255)
    country: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    address: Optional[str] = None
    postal_code: Optional[str] = Field(default=None, max_length=20)
    phone: Optional[str] = Field(default=None, max_length=20)
    email: Optional[EmailStr] = None
    timezone: Optional[str] = Field(default=None, max_length=50)
    principal_investigator_id: Optional[UUID] = None
    status: Optional[str] = Field(default=None, pattern="^(ACTIVE|INACTIVE|CLOSED)$")
    closure_date: Optional[date] = None
    has_offline_capability: Optional[bool] = None
    meta_data: Optional[Dict[str, Any]] = None


class PrincipalInvestigator(BaseSchema):
    """PI summary for site response."""

    id: UUID
    name: str = Field(validation_alias=AliasChoices("full_name", "name"))
    email: Optional[str] = None


class SiteResponse(IDTimestampSchema, SiteBase):
    """Site response schema."""

    study_id: UUID
    status: str
    activation_date: Optional[date] = None
    closure_date: Optional[date] = None
    principal_investigator: Optional[PrincipalInvestigator] = None
    principal_investigator_name: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("principal_investigator_full_name", "principal_investigator_name"),
    )
    storage_locations_count: int = 0
    total_items_stored: int = 0
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("meta_data", "metadata"),
    )
