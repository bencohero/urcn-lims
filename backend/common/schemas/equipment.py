"""Equipment schemas."""

from datetime import date
from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import AliasChoices, Field

from .base import BaseSchema, IDTimestampSchema
from .document import StoredItemBase, StudySummary, SiteSummary, ContainerSummary, LocationSummary, RFIDTagSummary


class EquipmentBase(BaseSchema):
    """Base equipment schema."""

    equipment_type: str = Field(max_length=100)
    manufacturer: Optional[str] = Field(default=None, max_length=255)
    model: Optional[str] = Field(default=None, max_length=255)
    serial_number: Optional[str] = Field(default=None, max_length=255)
    calibration_required: bool = False
    last_calibration_date: Optional[date] = None
    next_calibration_date: Optional[date] = None
    maintenance_schedule: Optional[str] = Field(default=None, max_length=100)
    last_maintenance_date: Optional[date] = None
    warranty_expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = Field(default=None, ge=0)
    currency: str = Field(default="EUR", max_length=10)
    operational_status: str = Field(
        default="OPERATIONAL",
        pattern="^(OPERATIONAL|MAINTENANCE|DEFECTIVE|RETIRED)$"
    )


class EquipmentCreate(StoredItemBase, EquipmentBase):
    """Schema for creating equipment."""

    study_id: UUID
    site_id: UUID
    container_id: Optional[UUID] = None


class EquipmentUpdate(BaseSchema):
    """Schema for updating equipment."""

    container_id: Optional[UUID] = None
    description: Optional[str] = None
    physical_condition: Optional[str] = Field(
        default=None, pattern="^(GOOD|FAIR|DAMAGED)$"
    )
    location_notes: Optional[str] = None
    last_calibration_date: Optional[date] = None
    next_calibration_date: Optional[date] = None
    last_maintenance_date: Optional[date] = None
    operational_status: Optional[str] = Field(
        default=None,
        pattern="^(OPERATIONAL|MAINTENANCE|DEFECTIVE|RETIRED)$"
    )
    equipment_metadata: Optional[Dict[str, Any]] = None


class EquipmentResponse(IDTimestampSchema, EquipmentBase):
    """Equipment response schema."""

    stored_item_id: UUID = Field(validation_alias=AliasChoices("id", "stored_item_id"))
    status: str
    storage_date: date
    expected_retention_until: Optional[date] = None
    internal_code: Optional[str] = None
    description: Optional[str] = None
    physical_condition: str
    study: Optional[StudySummary] = None
    site: Optional[SiteSummary] = None
    container: Optional[ContainerSummary] = None
    location: Optional[LocationSummary] = None
    rfid_tag: Optional[RFIDTagSummary] = None
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        validation_alias=AliasChoices("equipment_metadata", "metadata"),
    )
