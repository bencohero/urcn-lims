"""Storage locations and containers routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession


from common.database import get_db
from common.models import User
from common.schemas.storage import (
    StorageLocationCreate,
    StorageLocationResponse,
    StorageLocationUpdate,
    ContainerCreate,
    ContainerResponse,
    ContainerUpdate,
)
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.storage_service import StorageService

router = APIRouter()


# Storage Locations
@router.get("/storage-locations", response_model=PaginatedResponse)
async def get_storage_locations(
    site_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    parent_location_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of storage locations."""
    service = StorageService(db)
    locations, total = await service.get_storage_locations(
        site_id=site_id,
        status=status,
        parent_location_id=parent_location_id,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[StorageLocationResponse.model_validate(l) for l in locations],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("/storage-locations", response_model=APIResponse[StorageLocationResponse], status_code=status.HTTP_201_CREATED)
async def create_storage_location(
    location_data: StorageLocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("storage", "create")),
):
    """Create a new storage location."""
    service = StorageService(db)
    location = await service.create_storage_location(location_data, current_user)
    return APIResponse(
        success=True,
        data=StorageLocationResponse.model_validate(location),
        message="Storage location created successfully",
    )


@router.get("/storage-locations/{location_id}", response_model=APIResponse[StorageLocationResponse])
async def get_storage_location(
    location_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get storage location by ID."""
    service = StorageService(db)
    location = await service.get_storage_location_by_id(location_id, current_user)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storage location not found",
        )
    return APIResponse(
        success=True,
        data=StorageLocationResponse.model_validate(location),
    )


@router.put("/storage-locations/{location_id}", response_model=APIResponse[StorageLocationResponse])
async def update_storage_location(
    location_id: UUID,
    location_data: StorageLocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("storage", "update")),
):
    """Update a storage location."""
    service = StorageService(db)
    location = await service.update_storage_location(location_id, location_data, current_user)
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Storage location not found",
        )
    return APIResponse(
        success=True,
        data=StorageLocationResponse.model_validate(location),
        message="Storage location updated successfully",
    )


# Containers
@router.get("/containers", response_model=PaginatedResponse)
async def get_containers(
    location_id: Optional[UUID] = Query(None),
    container_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of containers."""
    service = StorageService(db)
    containers, total = await service.get_containers(
        location_id=location_id,
        container_type=container_type,
        status=status,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[ContainerResponse.model_validate(c) for c in containers],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("/containers", response_model=APIResponse[ContainerResponse], status_code=status.HTTP_201_CREATED)
async def create_container(
    container_data: ContainerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("storage", "create")),
):
    """Create a new container."""
    service = StorageService(db)
    container = await service.create_container(container_data, current_user)
    return APIResponse(
        success=True,
        data=ContainerResponse.model_validate(container),
        message="Container created successfully",
    )


@router.get("/containers/{container_id}", response_model=APIResponse[ContainerResponse])
async def get_container(
    container_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get container by ID."""
    service = StorageService(db)
    container = await service.get_container_by_id(container_id, current_user)
    if not container:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Container not found",
        )
    return APIResponse(
        success=True,
        data=ContainerResponse.model_validate(container),
    )


@router.put("/containers/{container_id}", response_model=APIResponse[ContainerResponse])
async def update_container(
    container_id: UUID,
    container_data: ContainerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("storage", "update")),
):
    """Update a container."""
    service = StorageService(db)
    container = await service.update_container(container_id, container_data, current_user)
    if not container:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Container not found",
        )
    return APIResponse(
        success=True,
        data=ContainerResponse.model_validate(container),
        message="Container updated successfully",
    )
