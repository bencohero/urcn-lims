"""Consumable schemas."""

from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema, IDTimestampSchema
from .document import StoredItemBase, StudySummary, SiteSummary, ContainerSummary, LocationSummary


class ConsumableBase(BaseSchema):
    """Base consumable schema."""

    consumable_type: str = Field(max_length=100)
    manufacturer: Optional[str] = Field(default=None, max_length=255)
    catalog_number: Optional[str] = Field(default=None, max_length=255)
    lot_number: Optional[str] = Field(default=None, max_length=255)
    expiry_date: Optional[date] = None
    storage_conditions: Optional[str] = Field(default=None, max_length=255)
    hazardous: bool = False
    hazard_classification: Optional[str] = Field(default=None, max_length=255)
    minimum_stock_level: Optional[int] = Field(default=None, ge=0)
    reorder_point: Optional[int] = Field(default=None, ge=0)


class ConsumableCreate(StoredItemBase, ConsumableBase):
    """Schema for creating consumable."""

    study_id: UUID
    site_id: UUID
    container_id: Optional[UUID] = None


class ConsumableUpdate(BaseSchema):
    """Schema for updating consumable."""

    container_id: Optional[UUID] = None
    description: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=0)
    physical_condition: Optional[str] = Field(
        default=None, pattern="^(GOOD|FAIR|DAMAGED)$"
    )
    location_notes: Optional[str] = None
    expiry_date: Optional[date] = None
    minimum_stock_level: Optional[int] = Field(default=None, ge=0)
    reorder_point: Optional[int] = Field(default=None, ge=0)
    metadata: Optional[Dict[str, Any]] = None


class ConsumableResponse(IDTimestampSchema, ConsumableBase):
    """Consumable response schema."""

    stored_item_id: UUID
    status: str
    storage_date: date
    expected_retention_until: Optional[date] = None
    internal_code: Optional[str] = None
    description: Optional[str] = None
    quantity: int
    unit: Optional[str] = None
    physical_condition: str
    study: Optional[StudySummary] = None
    site: Optional[SiteSummary] = None
    container: Optional[ContainerSummary] = None
    location: Optional[LocationSummary] = None
    is_expired: bool = False
    is_low_stock: bool = False
    metadata: Optional[Dict[str, Any]] = None
