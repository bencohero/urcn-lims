"""Studies routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.study import StudyCreate, StudyResponse, StudyUpdate
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.study_service import StudyService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_studies(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of studies with pagination and filters."""
    service = StudyService(db)
    studies, total = await service.get_studies(
        status=status,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[StudyResponse.model_validate(s) for s in studies],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("", response_model=APIResponse[StudyResponse], status_code=status.HTTP_201_CREATED)
async def create_study(
    study_data: StudyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("studies", "create")),
):
    """Create a new study."""
    service = StudyService(db)
    study = await service.create_study(study_data, current_user)
    return APIResponse(
        success=True,
        data=StudyResponse.model_validate(study),
        message="Study created successfully",
    )


@router.get("/{study_id}", response_model=APIResponse[StudyResponse])
async def get_study(
    study_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get study by ID."""
    service = StudyService(db)
    study = await service.get_study_by_id(study_id, current_user)
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found",
        )
    return APIResponse(
        success=True,
        data=StudyResponse.model_validate(study),
    )


@router.put("/{study_id}", response_model=APIResponse[StudyResponse])
async def update_study(
    study_id: UUID,
    study_data: StudyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("studies", "update")),
):
    """Update study."""
    service = StudyService(db)
    study = await service.update_study(study_id, study_data, current_user)
    if not study:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study not found",
        )
    return APIResponse(
        success=True,
        data=StudyResponse.model_validate(study),
        message="Study updated successfully",
    )
