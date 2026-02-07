"""Storage location and container schemas."""

from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema, IDTimestampSchema


class StorageLocationBase(BaseSchema):
    """Base storage location schema."""

    name: str = Field(max_length=255)
    code: Optional[str] = Field(default=None, max_length=50)
    location_type: str = Field(pattern="^(ROOM|ZONE|AREA)$")
    description: Optional[str] = None
    floor: Optional[str] = Field(default=None, max_length=20)
    building: Optional[str] = Field(default=None, max_length=100)
    temperature_controlled: bool = False
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    humidity_controlled: bool = False
    access_restricted: bool = False
    capacity_cubic_meters: Optional[float] = Field(default=None, ge=0)


class StorageLocationCreate(StorageLocationBase):
    """Schema for creating storage location."""

    site_id: UUID
    parent_location_id: Optional[UUID] = None


class StorageLocationUpdate(BaseSchema):
    """Schema for updating storage location."""

    name: Optional[str] = Field(default=None, max_length=255)
    code: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    temperature_controlled: Optional[bool] = None
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    humidity_controlled: Optional[bool] = None
    access_restricted: Optional[bool] = None
    capacity_cubic_meters: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = Field(default=None, pattern="^(ACTIVE|MAINTENANCE|CLOSED)$")
    metadata: Optional[Dict[str, Any]] = None


class StorageLocationChild(BaseSchema):
    """Child location summary."""

    id: UUID
    name: str
    code: Optional[str]
    location_type: str
    containers_count: int = 0
    items_count: int = 0


class StorageLocationResponse(IDTimestampSchema, StorageLocationBase):
    """Storage location response schema."""

    site_id: UUID
    parent_location_id: Optional[UUID]
    status: str
    current_usage_percent: float = 0.0
    children: List[StorageLocationChild] = []
    containers_count: int = 0
    items_count: int = 0
    metadata: Optional[Dict[str, Any]] = None


class ContainerBase(BaseSchema):
    """Base container schema."""

    container_type: str = Field(pattern="^(CABINET|SHELF|DRAWER|BOX)$")
    name: str = Field(max_length=255)
    code: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    capacity_items: Optional[int] = Field(default=None, ge=1)
    dimensions_cm: Optional[str] = Field(default=None, max_length=50)
    material: Optional[str] = Field(default=None, max_length=100)
    locked: bool = False
    barcode: Optional[str] = Field(default=None, max_length=255)


class ContainerCreate(ContainerBase):
    """Schema for creating container."""

    location_id: UUID
    parent_container_id: Optional[UUID] = None


class ContainerUpdate(BaseSchema):
    """Schema for updating container."""

    name: Optional[str] = Field(default=None, max_length=255)
    code: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    capacity_items: Optional[int] = Field(default=None, ge=1)
    locked: Optional[bool] = None
    barcode: Optional[str] = Field(default=None, max_length=255)
    status: Optional[str] = Field(default=None, pattern="^(ACTIVE|MAINTENANCE|RETIRED)$")
    metadata: Optional[Dict[str, Any]] = None


class ContainerResponse(IDTimestampSchema, ContainerBase):
    """Container response schema."""

    location_id: UUID
    parent_container_id: Optional[UUID]
    status: str
    current_count: int = 0
    usage_percent: float = 0.0
    metadata: Optional[Dict[str, Any]] = None
