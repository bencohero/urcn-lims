"""Sites routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.site import SiteCreate, SiteResponse, SiteUpdate
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.site_service import SiteService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_sites(
    study_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    country: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of sites with pagination and filters."""
    service = SiteService(db)
    sites, total = await service.get_sites(
        study_id=study_id,
        status=status,
        country=country,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[SiteResponse.model_validate(s) for s in sites],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("", response_model=APIResponse[SiteResponse], status_code=status.HTTP_201_CREATED)
async def create_site(
    site_data: SiteCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("sites", "create")),
):
    """Create a new site."""
    service = SiteService(db)
    site = await service.create_site(site_data, current_user)
    return APIResponse(
        success=True,
        data=SiteResponse.model_validate(site),
        message="Site created successfully",
    )


@router.get("/{site_id}", response_model=APIResponse[SiteResponse])
async def get_site(
    site_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get site by ID."""
    service = SiteService(db)
    site = await service.get_site_by_id(site_id, current_user)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    return APIResponse(
        success=True,
        data=SiteResponse.model_validate(site),
    )


@router.put("/{site_id}", response_model=APIResponse[SiteResponse])
async def update_site(
    site_id: UUID,
    site_data: SiteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("sites", "update")),
):
    """Update site."""
    service = SiteService(db)
    site = await service.update_site(site_id, site_data, current_user)
    if not site:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Site not found",
        )
    return APIResponse(
        success=True,
        data=SiteResponse.model_validate(site),
        message="Site updated successfully",
    )
