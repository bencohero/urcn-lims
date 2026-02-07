"""JWT token management."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from uuid import UUID

from jose import JWTError, jwt
from pydantic import BaseModel

from common.config import get_settings

settings = get_settings()


class TokenPayload(BaseModel):
    """JWT token payload."""

    sub: str  # User ID
    exp: datetime  # Expiration time
    iat: datetime  # Issued at
    type: str  # Token type: access or refresh
    jti: Optional[str] = None  # JWT ID for revocation


def create_access_token(
    user_id: UUID,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Create a new access token.

    Args:
        user_id: The user's UUID
        expires_delta: Custom expiration time
        additional_claims: Additional claims to include in the token

    Returns:
        Encoded JWT access token
    """
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "type": "access",
    }

    if additional_claims:
        to_encode.update(additional_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    user_id: UUID,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a new refresh token.

    Args:
        user_id: The user's UUID
        expires_delta: Custom expiration time

    Returns:
        Encoded JWT refresh token
    """
    if expires_delta is None:
        expires_delta = timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    import uuid as uuid_lib

    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "iat": now,
        "type": "refresh",
        "jti": str(uuid_lib.uuid4()),  # Unique ID for revocation
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenPayload]:
    """
    Decode and validate a JWT token.

    Args:
        token: The JWT token to decode

    Returns:
        TokenPayload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return TokenPayload(**payload)
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[UUID]:
    """
    Verify a JWT token and return the user ID.

    Args:
        token: The JWT token to verify
        token_type: Expected token type (access or refresh)

    Returns:
        User UUID if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None

    if payload.type != token_type:
        return None

    if payload.exp < datetime.now(timezone.utc):
        return None

    try:
        return UUID(payload.sub)
    except ValueError:
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """
    Get the expiration time of a token.

    Args:
        token: The JWT token

    Returns:
        Expiration datetime if valid, None otherwise
    """
    payload = decode_token(token)
    if payload is None:
        return None
    return payload.exp
