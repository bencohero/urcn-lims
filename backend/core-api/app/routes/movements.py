"""Movement tracking routes."""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.movement import MovementCreate, MovementResponse
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.movement_service import MovementService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_movements(
    stored_item_id: Optional[UUID] = Query(None),
    movement_type: Optional[str] = Query(None),
    performed_by_id: Optional[UUID] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of movements with filters."""
    service = MovementService(db)
    movements, total = await service.get_movements(
        stored_item_id=stored_item_id,
        movement_type=movement_type,
        performed_by_id=performed_by_id,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[MovementResponse.model_validate(m) for m in movements],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("", response_model=APIResponse[MovementResponse], status_code=status.HTTP_201_CREATED)
async def create_movement(
    movement_data: MovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("movements", "create")),
):
    """Record a new item movement."""
    service = MovementService(db)
    movement = await service.create_movement(movement_data, current_user)
    return APIResponse(
        success=True,
        data=MovementResponse.model_validate(movement),
        message="Movement recorded successfully",
    )


@router.get("/overdue", response_model=APIResponse)
async def get_overdue_movements(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get movements with overdue returns."""
    service = MovementService(db)
    movements = await service.get_overdue_movements(current_user)
    return APIResponse(
        success=True,
        data=[MovementResponse.model_validate(m) for m in movements],
    )


@router.get("/{movement_id}", response_model=APIResponse[MovementResponse])
async def get_movement(
    movement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get movement by ID."""
    service = MovementService(db)
    movement = await service.get_movement_by_id(movement_id, current_user)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movement not found",
        )
    return APIResponse(
        success=True,
        data=MovementResponse.model_validate(movement),
    )


@router.post("/{movement_id}/return", response_model=APIResponse[MovementResponse])
async def record_return(
    movement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("movements", "update")),
):
    """Record the return of an item from an outgoing movement."""
    service = MovementService(db)
    movement = await service.record_return(movement_id, current_user)
    if not movement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movement not found",
        )
    return APIResponse(
        success=True,
        data=MovementResponse.model_validate(movement),
        message="Return recorded successfully",
    )
