"""Consumables routes."""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession


import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.consumable import ConsumableCreate, ConsumableResponse, ConsumableUpdate
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.consumable_service import ConsumableService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_consumables(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    consumable_type: Optional[str] = Query(None),
    expiry_before: Optional[date] = Query(None),
    hazardous: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of consumables with pagination and filters."""
    service = ConsumableService(db)
    consumables, total = await service.get_consumables(
        study_id=study_id,
        site_id=site_id,
        consumable_type=consumable_type,
        expiry_before=expiry_before,
        hazardous=hazardous,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[ConsumableResponse.model_validate(c) for c in consumables],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("", response_model=APIResponse[ConsumableResponse], status_code=status.HTTP_201_CREATED)
async def create_consumable(
    consumable_data: ConsumableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("consumables", "create")),
):
    """Register new consumable."""
    service = ConsumableService(db)
    consumable = await service.create_consumable(consumable_data, current_user)
    return APIResponse(
        success=True,
        data=ConsumableResponse.model_validate(consumable),
        message="Consumable registered successfully",
    )


@router.get("/{consumable_id}", response_model=APIResponse[ConsumableResponse])
async def get_consumable(
    consumable_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get consumable by ID."""
    service = ConsumableService(db)
    consumable = await service.get_consumable_by_id(consumable_id, current_user)
    if not consumable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumable not found",
        )
    return APIResponse(
        success=True,
        data=ConsumableResponse.model_validate(consumable),
    )


@router.put("/{consumable_id}", response_model=APIResponse[ConsumableResponse])
async def update_consumable(
    consumable_id: UUID,
    consumable_data: ConsumableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("consumables", "update")),
):
    """Update consumable."""
    service = ConsumableService(db)
    consumable = await service.update_consumable(consumable_id, consumable_data, current_user)
    if not consumable:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumable not found",
        )
    return APIResponse(
        success=True,
        data=ConsumableResponse.model_validate(consumable),
        message="Consumable updated successfully",
    )


@router.delete("/{consumable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_consumable(
    consumable_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("consumables", "delete")),
):
    """Soft delete consumable (archive)."""
    service = ConsumableService(db)
    success = await service.delete_consumable(consumable_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumable not found",
        )
    return None
