"""Utility modules."""

from .exceptions import (
    APIException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
    ValidationException,
)
from .constants import (
    DocumentType,
    EquipmentType,
    ConsumableType,
    ItemStatus,
    AccessRequestStatus,
    AccessRequestType,
    MovementType,
    NotificationType,
    NotificationPriority,
    UserRole,
)
from .logger import get_logger, setup_logging
from .validators import (
    validate_uuid,
    validate_date,
    validate_email,
    validate_phone,
    sanitize_string,
)

__all__ = [
    "APIException",
    "BadRequestException",
    "ConflictException",
    "ForbiddenException",
    "NotFoundException",
    "UnauthorizedException",
    "ValidationException",
    "DocumentType",
    "EquipmentType",
    "ConsumableType",
    "ItemStatus",
    "AccessRequestStatus",
    "AccessRequestType",
    "MovementType",
    "NotificationType",
    "NotificationPriority",
    "UserRole",
    "get_logger",
    "setup_logging",
    "validate_uuid",
    "validate_date",
    "validate_email",
    "validate_phone",
    "sanitize_string",
]
