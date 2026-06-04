"""RBAC permission management."""

from typing import TYPE_CHECKING, List, Optional, Set
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from common.models import User


class PermissionChecker:
    """Helper class for checking user permissions."""

    def __init__(self, user: "User"):
        self.user = user
        self._permissions_cache: Optional[dict[dict]] = None
        self._site_ids_cache: Optional[Set[UUID]] = None

    @property
    def permissions(self) -> dict:
        """Get aggregated permissions from all user roles."""
        if self._permissions_cache is None:
            self._permissions_cache.setdefault("*", {})  # Initialize wildcard permissions
            for site_user in self.user.site_users:
            
                if site_user.is_active and site_user.role and site_user.site:
                    self._permissions_cache.setdefault(site_user.site_id, {})  # Initialize site-specific permissions
                    for resource, actions in site_user.role.permissions.items():
                        if resource not in self._permissions_cache.get(site_user.site_id, {}):
                            self._permissions_cache[site_user.site_id][resource] = {}
                        if isinstance(actions, dict):
                            for action, granted in actions.items():
                                if granted:
                                    self._permissions_cache[site_user.site_id][resource][action] = True
        return self._permissions_cache

    @property
    def site_ids(self) -> Set[UUID]:
        """Get set of site IDs user has access to."""
        if self._site_ids_cache is None:
            self._site_ids_cache = {
                su.site_id for su in self.user.site_users if su.is_active
            }
        return self._site_ids_cache

    def has_permission(self, site_id: Optional[UUID], resource: str, action: str) -> bool:
        """
        Check if user has permission for a resource action.

        Args:
            site_id: Site UUID to check (can be None for global permissions)
            resource: Resource name (e.g., 'documents', 'equipment')
            action: Action name (e.g., 'create', 'read', 'update', 'delete')

        Returns:
            True if permission is granted
        """
        if self.user.is_superuser:
            return True
        
        if site_id is None:
            # Check global wildcard permission
            if "*" in self.permissions.get("*", {}):
                if self.permissions["*"].get(action, False):
                    return True
            # Check global specific resource
            return self.permissions.get("*", {}).get(resource, {}).get(action, False)

        # Check wildcard permission
        if "*" in self.permissions.get(site_id, {}):
            if self.permissions[site_id]["*"].get(action, False):
                return True

        # Check specific resource
        return self.permissions.get(site_id, {}).get(resource, {}).get(action, False)
    
    def has_role(self, site_id: Optional[UUID], role_code: str) -> bool:
        """
        Check if user has a specific role.

        Args:
            site_id: Site UUID to check (can be None for global roles)
            role_code: Role code to check

        Returns:
            True if user has the role
        """
        if self.user.is_superuser:
            return True
        
        if site_id is not None:
            for site_user in self.user.site_users:
                if site_user.is_active and site_user.site_id == site_id and site_user.role:
                    if site_user.role.code == role_code:
                        return True
        else:
            for site_user in self.user.site_users:
                if site_user.is_active and site_user.role:
                    if site_user.role.code == role_code:
                        return True
        return False

    def has_site_access(self, site_id: UUID) -> bool:
        """
        Check if user has access to a specific site.

        Args:
            site_id: Site UUID to check

        Returns:
            True if user has access to the site
        """
        if self.user.is_superuser:
            return True
        return site_id in self.site_ids

    def filter_sites(self, site_ids: List[UUID]) -> List[UUID]:
        """
        Filter list of site IDs to only those user has access to.

        Args:
            site_ids: List of site UUIDs to filter

        Returns:
            Filtered list of accessible site IDs
        """
        if self.user.is_superuser:
            return site_ids
        return [sid for sid in site_ids if sid in self.site_ids]


def has_permission(user: "User", site_id: Optional[UUID], resource: str, action: str) -> bool:
    """
    Check if user has permission for a resource action.

    Args:
        user: User model instance
        resource: Resource name
        action: Action name

    Returns:
        True if permission is granted
    """
    checker = PermissionChecker(user)
    if not checker.has_site_access():
        return False
    return checker.has_permission(site_id, resource, action)


def has_role(user: "User", role_code: str) -> bool:
    """
    Check if user has a specific role.

    Args:
        user: User model instance
        role_code: Role code to check

    Returns:
        True if user has the role
    """
    checker = PermissionChecker(user)
    return checker.has_role(role_code)


async def filter_by_user_sites(
    user: "User",
    query,
    site_id_column,
) -> any:
    """
    Add site filter to query based on user's accessible sites.

    Args:
        user: User model instance
        query: SQLAlchemy select query
        site_id_column: Column to filter on

    Returns:
        Modified query with site filter
    """
    if user.is_superuser:
        return query

    checker = PermissionChecker(user)
    return query.where(site_id_column.in_(checker.site_ids))
