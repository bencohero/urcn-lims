"""
Role model for RBAC (Role-Based Access Control).
"""

from typing import TYPE_CHECKING, Any, Dict, List, Optional

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import BaseModel

if TYPE_CHECKING:
    from .site_user import SiteUser


class Role(BaseModel):
    """Role model with RBAC permissions."""

    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Permissions stored as JSONB
    # Format: {"resource": {"action": bool}}
    # Example: {"documents": {"create": true, "read": true, "update": false}}
    permissions: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)

    # System roles cannot be modified
    is_system_role: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    site_users: Mapped[List["SiteUser"]] = relationship(
        "SiteUser", back_populates="role", lazy="selectin"
    )

    def has_permission(self, resource: str, action: str) -> bool:
        """
        Check if role has permission for a resource action.

        Args:
            resource: Resource name (e.g., 'documents', 'equipment')
            action: Action name (e.g., 'create', 'read', 'update', 'delete')

        Returns:
            True if permission is granted, False otherwise
        """
        if not self.permissions:
            return False

        # Check wildcard permission
        if "*" in self.permissions:
            wildcard = self.permissions["*"]
            if isinstance(wildcard, dict) and wildcard.get(action, False):
                return True

        # Check specific resource permission
        resource_perms = self.permissions.get(resource, {})
        if isinstance(resource_perms, dict):
            return resource_perms.get(action, False)

        return False

    def get_all_permissions(self) -> Dict[str, List[str]]:
        """Get all granted permissions as resource: [actions] dict."""
        result = {}
        for resource, actions in self.permissions.items():
            if isinstance(actions, dict):
                granted = [action for action, granted in actions.items() if granted]
                if granted:
                    result[resource] = granted
        return result

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, code={self.code})>"
