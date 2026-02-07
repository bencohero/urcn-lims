"""RFID tag schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema, IDTimestampSchema


class RFIDTagBase(BaseSchema):
    """Base RFID tag schema."""

    epc: str = Field(max_length=255)
    tid: Optional[str] = Field(default=None, max_length=255)
    tag_type: str = Field(default="UHF_GEN2", max_length=50)


class RFIDTagCreate(BaseSchema):
    """Schema for encoding a new RFID tag."""

    associated_item_id: UUID
    associated_item_type: str = Field(pattern="^(DOCUMENT|EQUIPMENT|CONSUMABLE)$")
    user_memory: Optional[Dict[str, Any]] = None


class RFIDTagResponse(IDTimestampSchema, RFIDTagBase):
    """RFID tag response schema."""

    associated_item_id: Optional[UUID]
    associated_item_type: Optional[str]
    user_memory: Optional[str]
    encoding_date: datetime
    last_read_date: Optional[datetime]
    read_count: int = 0
    status: str


class RFIDReadRequest(BaseSchema):
    """Schema for reading an RFID tag."""

    reader_id: str = Field(max_length=100)
    epc: str = Field(max_length=255)


class ItemInfo(BaseSchema):
    """Basic item info for RFID read response."""

    id: UUID
    type: str
    description: Optional[str]
    status: str
    location: Optional[Dict[str, str]] = None


class RFIDReadResponse(BaseSchema):
    """Response for RFID read operation."""

    tag: RFIDTagResponse
    item: Optional[ItemInfo]


class RFIDBulkReadRequest(BaseSchema):
    """Schema for bulk RFID read (inventory)."""

    reader_id: str = Field(max_length=100)
    location_id: Optional[UUID] = None
    epcs: List[str]


class BulkReadResult(BaseSchema):
    """Single tag result in bulk read."""

    epc: str
    item: Optional[ItemInfo]
    error: Optional[str] = None


class RFIDBulkReadResponse(BaseSchema):
    """Response for bulk RFID read operation."""

    total_tags_read: int
    successful_reads: int
    failed_reads: int
    tags: List[BulkReadResult]
