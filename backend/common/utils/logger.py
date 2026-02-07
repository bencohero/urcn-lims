"""Logging configuration with structlog."""

import logging
import sys
from typing import Any, Dict

import structlog

from common.config import get_settings

settings = get_settings()


def setup_logging() -> None:
    """Configure structured logging for the application."""

    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL.upper()),
    )

    # Configure structlog processors
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.LOG_FORMAT == "json":
        # JSON format for production
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]
    else:
        # Console format for development
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def get_logger(name: str = None) -> structlog.BoundLogger:
    """
    Get a structured logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Bound structlog logger
    """
    return structlog.get_logger(name)


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: str = None,
    **extra: Any,
) -> None:
    """
    Log an HTTP request.

    Args:
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        user_id: Authenticated user ID
        **extra: Additional context
    """
    logger = get_logger("http")
    log_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
        **extra,
    }
    if user_id:
        log_data["user_id"] = user_id

    if status_code >= 500:
        logger.error("HTTP Request", **log_data)
    elif status_code >= 400:
        logger.warning("HTTP Request", **log_data)
    else:
        logger.info("HTTP Request", **log_data)


def log_audit(
    event_type: str,
    user_id: str,
    resource: str,
    resource_id: str = None,
    details: Dict[str, Any] = None,
) -> None:
    """
    Log an audit event.

    Args:
        event_type: Type of event (CREATE, UPDATE, DELETE, etc.)
        user_id: User who performed the action
        resource: Resource type
        resource_id: Resource identifier
        details: Additional details
    """
    logger = get_logger("audit")
    log_data = {
        "event_type": event_type,
        "user_id": user_id,
        "resource": resource,
    }
    if resource_id:
        log_data["resource_id"] = resource_id
    if details:
        log_data["details"] = details

    logger.info("Audit Event", **log_data)


def log_security(
    event: str,
    ip_address: str = None,
    user_id: str = None,
    details: Dict[str, Any] = None,
) -> None:
    """
    Log a security event.

    Args:
        event: Security event description
        ip_address: Client IP address
        user_id: User involved
        details: Additional details
    """
    logger = get_logger("security")
    log_data = {
        "event": f"Security Event: {event}",
    }
    if ip_address:
        log_data["ip_address"] = ip_address
    if user_id:
        log_data["user_id"] = user_id
    if details:
        log_data["details"] = details

    logger.warning(**log_data)
