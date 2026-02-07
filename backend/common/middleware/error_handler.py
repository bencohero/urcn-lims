"""Error handling middleware."""

from datetime import datetime
from typing import Callable

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from common.utils.exceptions import APIException
from common.utils.logger import get_logger

logger = get_logger(__name__)


class APIExceptionHandler:
    """Handler for API exceptions."""

    @staticmethod
    def create_error_response(
        code: str,
        message: str,
        status_code: int,
        details: dict = None,
    ) -> JSONResponse:
        """Create a standardized error response."""
        return JSONResponse(
            status_code=status_code,
            content={
                "success": False,
                "error": {
                    "code": code,
                    "message": message,
                    "details": details or {},
                },
                "timestamp": datetime.utcnow().isoformat() + "Z",
            },
        )


async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """Handle custom API exceptions."""
    logger.warning(
        "API Exception",
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        path=request.url.path,
    )
    return APIExceptionHandler.create_error_response(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handle HTTP exceptions."""
    logger.warning(
        "HTTP Exception",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
    )
    return APIExceptionHandler.create_error_response(
        code="HTTP_ERROR",
        message=str(exc.detail),
        status_code=exc.status_code,
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    errors = {}
    for error in exc.errors():
        loc = ".".join(str(l) for l in error["loc"])
        errors[loc] = error["msg"]

    logger.warning(
        "Validation Error",
        errors=errors,
        path=request.url.path,
    )
    return APIExceptionHandler.create_error_response(
        code="VALIDATION_ERROR",
        message="Validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"errors": errors},
    )


async def sqlalchemy_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """Handle SQLAlchemy database errors."""
    logger.error(
        "Database Error",
        error=str(exc),
        path=request.url.path,
        exc_info=True,
    )

    # Handle integrity errors (e.g., unique constraint violations)
    if isinstance(exc, IntegrityError):
        return APIExceptionHandler.create_error_response(
            code="INTEGRITY_ERROR",
            message="Database integrity error. The operation violates a constraint.",
            status_code=status.HTTP_409_CONFLICT,
        )

    return APIExceptionHandler.create_error_response(
        code="DATABASE_ERROR",
        message="A database error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unhandled exceptions."""
    logger.error(
        "Unhandled Exception",
        error=str(exc),
        error_type=type(exc).__name__,
        path=request.url.path,
        exc_info=True,
    )
    return APIExceptionHandler.create_error_response(
        code="INTERNAL_ERROR",
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def setup_error_handlers(app: FastAPI) -> None:
    """
    Register all error handlers for the FastAPI application.

    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
