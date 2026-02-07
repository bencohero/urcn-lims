"""Study schemas."""

from datetime import date
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema, IDTimestampSchema


class StudyBase(BaseSchema):
    """Base study schema."""

    protocol_number: str = Field(max_length=100)
    title: str = Field(max_length=500)
    sponsor: Optional[str] = Field(default=None, max_length=255)
    phase: Optional[str] = Field(default=None, max_length=50)
    therapeutic_area: Optional[str] = Field(default=None, max_length=255)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_enrollment: Optional[int] = Field(default=None, ge=0)
    retention_period_years: int = Field(default=10, ge=1)
    description: Optional[str] = None


class StudyCreate(StudyBase):
    """Schema for creating a study."""

    status: str = Field(default="ACTIVE", pattern="^(ACTIVE|PAUSED|COMPLETED|CANCELLED)$")


class StudyUpdate(BaseSchema):
    """Schema for updating a study."""

    title: Optional[str] = Field(default=None, max_length=500)
    sponsor: Optional[str] = Field(default=None, max_length=255)
    phase: Optional[str] = Field(default=None, max_length=50)
    therapeutic_area: Optional[str] = Field(default=None, max_length=255)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    estimated_enrollment: Optional[int] = Field(default=None, ge=0)
    retention_period_years: Optional[int] = Field(default=None, ge=1)
    description: Optional[str] = None
    status: Optional[str] = Field(
        default=None, pattern="^(ACTIVE|PAUSED|COMPLETED|CANCELLED)$"
    )
    metadata: Optional[Dict[str, Any]] = None


class StudyStatistics(BaseSchema):
    """Study statistics."""

    total_documents: int = 0
    total_equipment: int = 0
    total_consumables: int = 0
    active_access_requests: int = 0


class StudyResponse(IDTimestampSchema, StudyBase):
    """Study response schema."""

    status: str
    sites_count: int = 0
    statistics: Optional[StudyStatistics] = None
    metadata: Optional[Dict[str, Any]] = None
