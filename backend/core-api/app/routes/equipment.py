"""Equipment routes."""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.equipment_service import EquipmentService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_equipment(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    equipment_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    calibration_due_before: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of equipment with pagination and filters."""
    service = EquipmentService(db)
    equipment, total = await service.get_equipment(
        study_id=study_id,
        site_id=site_id,
        equipment_type=equipment_type,
        status=status,
        calibration_due_before=calibration_due_before,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[EquipmentResponse.model_validate(e) for e in equipment],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("/", response_model=APIResponse[EquipmentResponse], status_code=status.HTTP_201_CREATED)
async def create_equipment(
    equipment_data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "create")),
):
    """Register new equipment."""
    service = EquipmentService(db)
    equipment = await service.create_equipment(equipment_data, current_user)
    return APIResponse(
        success=True,
        data=EquipmentResponse.model_validate(equipment),
        message="Equipment registered successfully",
    )


@router.get("/{equipment_id}", response_model=APIResponse[EquipmentResponse])
async def get_equipment_by_id(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get equipment by ID."""
    service = EquipmentService(db)
    equipment = await service.get_equipment_by_id(equipment_id, current_user)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    return APIResponse(
        success=True,
        data=EquipmentResponse.model_validate(equipment),
    )


@router.put("/{equipment_id}", response_model=APIResponse[EquipmentResponse])
async def update_equipment(
    equipment_id: UUID,
    equipment_data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "update")),
):
    """Update equipment."""
    service = EquipmentService(db)
    equipment = await service.update_equipment(equipment_id, equipment_data, current_user)
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    return APIResponse(
        success=True,
        data=EquipmentResponse.model_validate(equipment),
        message="Equipment updated successfully",
    )


@router.delete("/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("equipment", "delete")),
):
    """Soft delete equipment (archive)."""
    service = EquipmentService(db)
    success = await service.delete_equipment(equipment_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Equipment not found",
        )
    return None
