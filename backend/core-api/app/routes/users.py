"""Users management routes."""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel as PydanticBaseModel

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession


from common.database import get_db
from common.models import User
from common.schemas.user import UserCreate, UserResponse, UserUpdate, AdminResetPasswordRequest, SiteRoleAssignmentResponse, SiteSummary
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission, require_role

from ..services.user_service import UserService

router = APIRouter()


class SiteRoleAssign(PydanticBaseModel):
    """Schema for assigning a user to a site with a role."""

    site_id: UUID
    role_id: UUID
    is_primary: bool = False


class SiteRoleUnassign(PydanticBaseModel):
    """Schema for removing a user's site-role assignment."""

    site_id: UUID
    role_id: UUID


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_current_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current authenticated user's profile."""
    service = UserService(db)
    user = await service.get_user_by_id(current_user.id)
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
    )


@router.get("/me/sites", response_model=APIResponse[list[SiteSummary]])
async def get_current_user_sites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the list of sites where the authenticated user has an active assignment."""
    service = UserService(db)
    sites = await service.get_user_active_sites(current_user.id)
    return APIResponse(success=True, data=sites)


@router.get("", response_model=PaginatedResponse)
async def get_users(
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users", "read")),
):
    """Get list of users."""
    service = UserService(db)
    users, total = await service.get_users(
        is_active=is_active,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse.create(
        items=[UserResponse.model_validate(u) for u in users],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Create a new user (admin only)."""
    service = UserService(db)
    user = await service.create_user(user_data, current_user)
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User created successfully",
    )


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users", "read")),
):
    """Get user by ID."""
    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
    )


@router.put("/{user_id}", response_model=APIResponse[UserResponse])
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("users", "update")),
):
    """Update user."""
    service = UserService(db)
    user = await service.update_user(user_id, user_data, current_user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User updated successfully",
    )


@router.delete("/{user_id}", response_model=APIResponse[UserResponse])
async def deactivate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Deactivate a user (admin only). Soft-disables the account."""
    service = UserService(db)
    user = await service.deactivate_user(user_id, current_user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User deactivated successfully",
    )


@router.post("/{user_id}/activate", response_model=APIResponse[UserResponse])
async def activate_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Reactivate a deactivated user (admin only)."""
    service = UserService(db)
    user = await service.activate_user(user_id, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User activated successfully",
    )


@router.post("/{user_id}/unlock", response_model=APIResponse[UserResponse])
async def unlock_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Unlock a locked user account (admin only)."""
    service = UserService(db)
    user = await service.unlock_user(user_id, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User account unlocked successfully",
    )


@router.post("/{user_id}/reset-password", response_model=APIResponse[UserResponse])
async def admin_reset_password(
    user_id: UUID,
    payload: AdminResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Force-reset a user's password (admin only)."""
    service = UserService(db)
    user = await service.admin_reset_password(user_id, payload.new_password, current_user)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="Password reset successfully",
    )


@router.get("/{user_id}/site-roles", response_model=APIResponse[list[SiteRoleAssignmentResponse]])
async def get_user_site_roles(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """List all site role assignments for a user (admin only)."""
    service = UserService(db)
    assignments = await service.get_user_site_roles(user_id)
    return APIResponse(success=True, data=assignments)


@router.post("/{user_id}/site-roles", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def assign_site_role(
    user_id: UUID,
    assignment: SiteRoleAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Assign a user to a site with a role (admin only)."""
    service = UserService(db)
    site_user = await service.assign_site_role(
        user_id=user_id,
        site_id=assignment.site_id,
        role_id=assignment.role_id,
        current_user=current_user,
        is_primary=assignment.is_primary,
    )
    return APIResponse(
        success=True,
        data={
            "id": str(site_user.id),
            "user_id": str(site_user.user_id),
            "site_id": str(site_user.site_id),
            "role_id": str(site_user.role_id),
            "is_primary": site_user.is_primary,
        },
        message="User assigned to site with role successfully",
    )


@router.delete("/{user_id}/site-roles", response_model=APIResponse)
async def unassign_site_role(
    user_id: UUID,
    unassignment: SiteRoleUnassign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Remove a user's role from a site (admin only)."""
    service = UserService(db)
    site_user = await service.unassign_site_role(
        user_id=user_id,
        site_id=unassignment.site_id,
        role_id=unassignment.role_id,
        current_user=current_user,
    )
    if not site_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site role assignment not found",
        )
    return APIResponse(
        success=True,
        data=None,
        message="User unassigned from site role successfully",
    )
