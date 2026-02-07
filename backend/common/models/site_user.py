"""
SiteUser model for user-site-role associations.
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .role import Role
    from .site import Site
    from .user import User


class SiteUser(BaseModel):
    """Association between users, sites, and roles."""

    __tablename__ = "site_users"
    __table_args__ = (
        UniqueConstraint(
            "user_id", "site_id", "role_id", name="uq_site_users_user_site_role"
        ),
    )

    # Foreign keys
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    site_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Primary contact for site
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    # Assignment dates
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    unassigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Audit
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="site_users")
    site: Mapped["Site"] = relationship("Site", back_populates="site_users")
    role: Mapped["Role"] = relationship("Role", back_populates="site_users")

    @property
    def is_active(self) -> bool:
        return self.unassigned_at is None

    def __repr__(self) -> str:
        return f"<SiteUser(user_id={self.user_id}, site_id={self.site_id}, role_id={self.role_id})>"
