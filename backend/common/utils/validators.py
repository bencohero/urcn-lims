"""Input validation utilities."""

import re
from datetime import date, datetime
from typing import Optional
from uuid import UUID


def validate_uuid(value: str) -> Optional[UUID]:
    """
    Validate and parse a UUID string.

    Args:
        value: String to validate

    Returns:
        UUID object if valid, None otherwise
    """
    try:
        return UUID(value)
    except (ValueError, TypeError):
        return None


def validate_date(value: str, fmt: str = "%Y-%m-%d") -> Optional[date]:
    """
    Validate and parse a date string.

    Args:
        value: Date string to validate
        fmt: Expected date format

    Returns:
        date object if valid, None otherwise
    """
    try:
        return datetime.strptime(value, fmt).date()
    except (ValueError, TypeError):
        return None


def validate_datetime(value: str) -> Optional[datetime]:
    """
    Validate and parse an ISO datetime string.

    Args:
        value: Datetime string to validate

    Returns:
        datetime object if valid, None otherwise
    """
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def validate_email(value: str) -> bool:
    """
    Validate an email address format.

    Args:
        value: Email to validate

    Returns:
        True if valid email format
    """
    if not value or not isinstance(value, str):
        return False

    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, value))


def validate_phone(value: str) -> bool:
    """
    Validate a phone number format.
    Accepts international format with optional + prefix.

    Args:
        value: Phone number to validate

    Returns:
        True if valid phone format
    """
    if not value or not isinstance(value, str):
        return False

    # Remove spaces, dashes, and parentheses
    cleaned = re.sub(r"[\s\-\(\)]", "", value)

    # Check format: optional +, then 7-15 digits
    pattern = r"^\+?[0-9]{7,15}$"
    return bool(re.match(pattern, cleaned))


def sanitize_string(value: str, max_length: int = None) -> str:
    """
    Sanitize a string input.
    - Strips whitespace
    - Removes control characters
    - Optionally truncates to max length

    Args:
        value: String to sanitize
        max_length: Maximum length (optional)

    Returns:
        Sanitized string
    """
    if not value or not isinstance(value, str):
        return ""

    # Strip whitespace
    result = value.strip()

    # Remove control characters (except newlines and tabs)
    result = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", result)

    # Truncate if needed
    if max_length and len(result) > max_length:
        result = result[:max_length]

    return result


def validate_protocol_number(value: str) -> bool:
    """
    Validate a protocol number format.
    Expected format: PROTO-YYYY-NNN or similar

    Args:
        value: Protocol number to validate

    Returns:
        True if valid format
    """
    if not value or not isinstance(value, str):
        return False

    # Allow alphanumeric with hyphens
    pattern = r"^[A-Z0-9\-]{3,50}$"
    return bool(re.match(pattern, value.upper()))


def validate_site_number(value: str) -> bool:
    """
    Validate a site number format.
    Expected format: 001, S001, SITE-001, etc.

    Args:
        value: Site number to validate

    Returns:
        True if valid format
    """
    if not value or not isinstance(value, str):
        return False

    # Allow alphanumeric with hyphens
    pattern = r"^[A-Z0-9\-]{1,20}$"
    return bool(re.match(pattern, value.upper()))


def validate_epc(value: str) -> bool:
    """
    Validate an RFID EPC format.
    Expected: 24-character hexadecimal string.

    Args:
        value: EPC to validate

    Returns:
        True if valid format
    """
    if not value or not isinstance(value, str):
        return False

    # 96-bit EPC = 24 hex characters
    pattern = r"^[A-F0-9]{24}$"
    return bool(re.match(pattern, value.upper()))
