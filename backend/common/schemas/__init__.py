"""Pydantic schemas for Clinical Storage System."""

from .base import BaseSchema, TimestampSchema
from .response import (
    APIResponse,
    ErrorDetail,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta,
)
from .user import UserCreate, UserResponse, UserUpdate
from .role import RoleCreate, RoleResponse
from .study import StudyCreate, StudyResponse, StudyUpdate
from .site import SiteCreate, SiteResponse, SiteUpdate
from .document import DocumentCreate, DocumentResponse, DocumentUpdate
from .equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate
from .consumable import ConsumableCreate, ConsumableResponse, ConsumableUpdate
from .storage import (
    ContainerCreate,
    ContainerResponse,
    StorageLocationCreate,
    StorageLocationResponse,
)
from .rfid import RFIDTagCreate, RFIDTagResponse, RFIDReadRequest, RFIDBulkReadRequest
from .movement import MovementCreate, MovementResponse
from .access_request import (
    AccessRequestCreate,
    AccessRequestResponse,
    AccessRequestApprove,
    AccessRequestReject,
)
from .notification import NotificationResponse
from .audit import AuditTrailResponse

__all__ = [
    "BaseSchema",
    "TimestampSchema",
    "APIResponse",
    "ErrorDetail",
    "ErrorResponse",
    "PaginatedResponse",
    "PaginationMeta",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    "RoleCreate",
    "RoleResponse",
    "StudyCreate",
    "StudyResponse",
    "StudyUpdate",
    "SiteCreate",
    "SiteResponse",
    "SiteUpdate",
    "DocumentCreate",
    "DocumentResponse",
    "DocumentUpdate",
    "EquipmentCreate",
    "EquipmentResponse",
    "EquipmentUpdate",
    "ConsumableCreate",
    "ConsumableResponse",
    "ConsumableUpdate",
    "ContainerCreate",
    "ContainerResponse",
    "StorageLocationCreate",
    "StorageLocationResponse",
    "RFIDTagCreate",
    "RFIDTagResponse",
    "RFIDReadRequest",
    "RFIDBulkReadRequest",
    "MovementCreate",
    "MovementResponse",
    "AccessRequestCreate",
    "AccessRequestResponse",
    "AccessRequestApprove",
    "AccessRequestReject",
    "NotificationResponse",
    "AuditTrailResponse",
]
