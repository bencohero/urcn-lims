"""Password hashing and validation."""

from passlib.context import CryptContext

from common.config import get_settings

settings = get_settings()

# Password hashing context using Argon2
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a password using Argon2.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Stored password hash

    Returns:
        True if password matches
    """
    return pwd_context.verify(plain_password, hashed_password)


def validate_password_strength(password: str) -> tuple[bool, list[str]]:
    """
    Validate password strength.

    Args:
        password: Password to validate

    Returns:
        Tuple of (is_valid, list of error messages)
    """
    errors = []

    if len(password) < settings.PASSWORD_MIN_LENGTH:
        errors.append(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters")

    if not any(c.isupper() for c in password):
        errors.append("Password must contain at least one uppercase letter")

    if not any(c.islower() for c in password):
        errors.append("Password must contain at least one lowercase letter")

    if not any(c.isdigit() for c in password):
        errors.append("Password must contain at least one digit")

    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        errors.append("Password must contain at least one special character")

    return len(errors) == 0, errors
