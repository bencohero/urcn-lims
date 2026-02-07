"""Role schemas."""

from typing import Any, Dict, Optional
from uuid import UUID

from pydantic import Field

from .base import BaseSchema, IDTimestampSchema


class RoleBase(BaseSchema):
    """Base role schema."""

    name: str = Field(max_length=100)
    code: str = Field(max_length=50)
    description: Optional[str] = None


class RoleCreate(RoleBase):
    """Schema for creating a role."""

    permissions: Dict[str, Any] = Field(
        description="Permissions in format: {resource: {action: bool}}"
    )
    is_system_role: bool = False


class RoleUpdate(BaseSchema):
    """Schema for updating a role."""

    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None


class RoleResponse(IDTimestampSchema, RoleBase):
    """Role response schema."""

    permissions: Dict[str, Any]
    is_system_role: bool
