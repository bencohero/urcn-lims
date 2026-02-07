"""Custom exception classes."""

from typing import Any, Dict, Optional


class APIException(Exception):
    """Base exception for API errors."""

    def __init__(
        self,
        message: str,
        code: str = "API_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        return {
            "code": self.code,
            "message": self.message,
            "details": self.details,
        }


class NotFoundException(APIException):
    """Resource not found exception."""

    def __init__(
        self,
        message: str = "Resource not found",
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
    ):
        details = {}
        if resource:
            details["resource"] = resource
        if resource_id:
            details["resource_id"] = resource_id

        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=404,
            details=details,
        )


class UnauthorizedException(APIException):
    """Unauthorized access exception."""

    def __init__(
        self,
        message: str = "Authentication required",
    ):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
        )


class ForbiddenException(APIException):
    """Forbidden access exception."""

    def __init__(
        self,
        message: str = "Permission denied",
        required_permission: Optional[str] = None,
    ):
        details = {}
        if required_permission:
            details["required_permission"] = required_permission

        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            details=details,
        )


class ValidationException(APIException):
    """Validation error exception."""

    def __init__(
        self,
        message: str = "Validation failed",
        errors: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details={"errors": errors or {}},
        )


class BadRequestException(APIException):
    """Bad request exception."""

    def __init__(
        self,
        message: str = "Bad request",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(
            message=message,
            code="BAD_REQUEST",
            status_code=400,
            details=details,
        )


class ConflictException(APIException):
    """Conflict exception (e.g., duplicate resource)."""

    def __init__(
        self,
        message: str = "Resource conflict",
        field: Optional[str] = None,
        value: Optional[str] = None,
    ):
        details = {}
        if field:
            details["field"] = field
        if value:
            details["value"] = value

        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=409,
            details=details,
        )


class RateLimitException(APIException):
    """Rate limit exceeded exception."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
    ):
        details = {}
        if retry_after:
            details["retry_after"] = retry_after

        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details,
        )
