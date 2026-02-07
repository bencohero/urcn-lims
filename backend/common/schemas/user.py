"""User schemas."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import EmailStr, Field

from .base import BaseSchema, IDTimestampSchema


class UserBase(BaseSchema):
    """Base user schema."""

    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)


class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str = Field(min_length=12, max_length=128)
    is_active: bool = True
    is_superuser: bool = False


class UserUpdate(BaseSchema):
    """Schema for updating a user."""

    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    phone: Optional[str] = Field(default=None, max_length=20)
    is_active: Optional[bool] = None
    mfa_enabled: Optional[bool] = None


class RoleSummary(BaseSchema):
    """Summary of role for user response."""

    code: str
    name: str


class SiteSummary(BaseSchema):
    """Summary of site for user response."""

    id: UUID
    site_number: str
    name: str


class UserResponse(IDTimestampSchema, UserBase):
    """User response schema."""

    is_active: bool
    is_superuser: bool
    mfa_enabled: bool
    last_login: Optional[datetime] = None
    roles: List[RoleSummary] = []
    sites: List[SiteSummary] = []

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"


class UserLogin(BaseSchema):
    """User login request schema."""

    username: str
    password: str
    mfa_code: Optional[str] = None


class TokenResponse(BaseSchema):
    """Token response schema."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int  # seconds


class LoginResponse(BaseSchema):
    """Login response with tokens and user info."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse


class RefreshTokenRequest(BaseSchema):
    """Refresh token request schema."""

    refresh_token: str


class ChangePasswordRequest(BaseSchema):
    """Change password request schema."""

    current_password: str
    new_password: str = Field(min_length=12, max_length=128)
    confirm_password: str
