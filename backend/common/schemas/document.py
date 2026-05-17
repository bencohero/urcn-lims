"""Document schemas."""

from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import AliasChoices, Field

from .base import BaseSchema, IDTimestampSchema


class StoredItemBase(BaseSchema):
    """Base stored item fields."""

    internal_code: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit: Optional[str] = Field(default=None, max_length=50)
    storage_date: date
    expected_retention_until: Optional[date] = None
    physical_condition: str = Field(
        default="GOOD", pattern="^(GOOD|FAIR|DAMAGED)$"
    )
    location_notes: Optional[str] = None


class DocumentBase(BaseSchema):
    """Base document schema."""

    document_type: str = Field(max_length=100)
    subject_id: Optional[str] = Field(default=None, max_length=100)
    visit_number: Optional[str] = Field(default=None, max_length=50)
    form_name: Optional[str] = Field(default=None, max_length=255)
    version: Optional[str] = Field(default=None, max_length=50)
    page_count: Optional[int] = Field(default=None, ge=1)
    original_language: Optional[str] = Field(default=None, max_length=10)
    signature_required: bool = False
    signed_date: Optional[date] = None
    confidentiality_level: str = Field(
        default="HIGH", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$"
    )
    retention_category: Optional[str] = Field(default=None, max_length=100)


class DocumentCreate(StoredItemBase, DocumentBase):
    """Schema for creating a document."""

    study_id: UUID
    site_id: UUID
    container_id: Optional[UUID] = None


class DocumentUpdate(BaseSchema):
    """Schema for updating a document."""

    container_id: Optional[UUID] = None
    description: Optional[str] = None
    physical_condition: Optional[str] = Field(
        default=None, pattern="^(GOOD|FAIR|DAMAGED)$"
    )
    location_notes: Optional[str] = None
    status: Optional[str] = Field(
        default=None, pattern="^(IN_STORAGE|CHECKED_OUT|IN_TRANSIT|ARCHIVED|DESTROYED)$"
    )
    confidentiality_level: Optional[str] = Field(
        default=None, pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$"
    )
    document_metadata: Optional[Dict[str, Any]] = None


class StudySummary(BaseSchema):
    """Study summary for responses."""

    protocol_number: str
    title: str


class SiteSummary(BaseSchema):
    """Site summary for responses."""

    site_number: str
    name: str


class ContainerSummary(BaseSchema):
    """Container summary for responses."""

    id: UUID
    name: str
    code: Optional[str] = None


class LocationSummary(BaseSchema):
    """Location summary for responses."""

    id: UUID
    name: str
    code: Optional[str] = None


class RFIDTagSummary(BaseSchema):
    """RFID tag summary for responses."""

    epc: str


class DocumentResponse(IDTimestampSchema, DocumentBase):
    """Document response schema."""

    stored_item_id: UUID = Field(validation_alias=AliasChoices("id", "stored_item_id"))
    study_id: UUID
    site_id: UUID
    container_id: Optional[UUID] = None
    status: str
    storage_date: date
    expected_retention_until: Optional[date] = None
    internal_code: Optional[str] = None
    description: Optional[str] = None
    physical_condition: str
    location_notes: Optional[str] = None
    study: Optional[StudySummary] = None
    site: Optional[SiteSummary] = None
    container: Optional[ContainerSummary] = None
    location: Optional[LocationSummary] = None
    rfid_tag: Optional[RFIDTagSummary] = None
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("document_metadata", "metadata"),
    )
