"""Roles routes (read-only for system roles)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from common.database import get_db
from common.models import Role, User
from common.schemas.role import RoleResponse
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all roles. Available to any authenticated user (needed for assignment dropdowns)."""
    query = select(Role).order_by(Role.name.asc())
    result = await db.execute(query)
    roles = result.scalars().all()
    items = [RoleResponse.model_validate(r) for r in roles]
    return PaginatedResponse.create(items=items, page=1, page_size=len(items) or 1, total_items=len(items))


@router.get("/{role_id}", response_model=APIResponse[RoleResponse])
async def get_role(
    role_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get role by ID."""
    query = select(Role).where(Role.id == role_id)
    result = await db.execute(query)
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return APIResponse(success=True, data=RoleResponse.model_validate(role))
