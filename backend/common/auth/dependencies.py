"""FastAPI authentication dependencies."""

from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from common.database import get_db
from common.models import User
from common.models.site_user import SiteUser
from .jwt import verify_token
from .permissions import PermissionChecker

# OAuth2 bearer token scheme
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer token credentials
        db: Database session

    Returns:
        Authenticated User model

    Raises:
        HTTPException: If authentication fails
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    user_id = verify_token(token, token_type="access")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user with roles and sites
    query = (
        select(User)
        .where(User.id == user_id)
        .options(
            selectinload(User.site_users).selectinload(SiteUser.role),
            selectinload(User.site_users).selectinload(SiteUser.site),
        )
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive",
        )

    if user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is locked",
        )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Get the current user if authenticated, None otherwise.

    Args:
        credentials: HTTP Bearer token credentials
        db: Database session

    Returns:
        User model or None
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_permission(resource: str, action: str):
    """
    Dependency factory for permission checking.

    Args:
        resource: Resource name (e.g., 'documents')
        action: Action name (e.g., 'create', 'read', 'update', 'delete')

    Returns:
        FastAPI dependency function

    Usage:
        @router.post("/", dependencies=[Depends(require_permission("documents", "create"))])
    """

    async def permission_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        checker = PermissionChecker(current_user)
        if not checker.has_permission(resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {resource}:{action}",
            )
        return current_user

    return permission_checker


def require_role(role_code: str):
    """
    Dependency factory for role checking.

    Args:
        role_code: Required role code

    Returns:
        FastAPI dependency function

    Usage:
        @router.get("/admin", dependencies=[Depends(require_role("ADMIN"))])
    """

    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        checker = PermissionChecker(current_user)
        if not checker.has_role(role_code):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {role_code}",
            )
        return current_user

    return role_checker


def require_site_access(site_id_param: str = "site_id"):
    """
    Dependency factory for site access checking.

    Args:
        site_id_param: Name of the path/query parameter containing site ID

    Returns:
        FastAPI dependency function
    """
    from uuid import UUID

    async def site_access_checker(
        current_user: User = Depends(get_current_user),
        site_id: UUID = None,
    ) -> User:
        if site_id is None:
            return current_user

        checker = PermissionChecker(current_user)
        if not checker.has_site_access(site_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access to this site is not permitted",
            )
        return current_user

    return site_access_checker
