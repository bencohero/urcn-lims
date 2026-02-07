"""
User model for authentication and authorization.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .site_user import SiteUser


class User(BaseModel):
    """User model representing system users."""

    __tablename__ = "users"

    # Authentication
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Login tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # MFA
    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    mfa_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Password management
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Audit
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    updated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    site_users: Mapped[List["SiteUser"]] = relationship(
        "SiteUser", back_populates="user", lazy="selectin"
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def is_locked(self) -> bool:
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until

    def has_permission(self, resource: str, action: str) -> bool:
        """Check if user has permission for a resource action."""
        if self.is_superuser:
            return True
        for site_user in self.site_users:
            if site_user.role and site_user.role.has_permission(resource, action):
                return True
        return False

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username})>"
