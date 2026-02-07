"""Storage service for locations and containers."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import Container, StorageLocation, User
from common.schemas.storage import (
    ContainerCreate,
    ContainerUpdate,
    StorageLocationCreate,
    StorageLocationUpdate,
)
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class StorageService:
    """Service for storage location and container operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    # ──────────────────────────────────────────────
    # Storage Locations
    # ──────────────────────────────────────────────

    async def get_storage_locations(
        self,
        site_id: Optional[UUID] = None,
        status: Optional[str] = None,
        parent_location_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[StorageLocation], int]:
        """Get storage locations with filters and pagination."""
        query = select(StorageLocation).options(
            selectinload(StorageLocation.site),
            selectinload(StorageLocation.children),
            selectinload(StorageLocation.containers),
        )

        filters = []
        if site_id:
            filters.append(StorageLocation.site_id == site_id)
        if status:
            filters.append(StorageLocation.status == status)
        if parent_location_id:
            filters.append(StorageLocation.parent_location_id == parent_location_id)
        else:
            # By default, return only root locations (no parent)
            if not site_id and not status:
                filters.append(StorageLocation.parent_location_id.is_(None))

        # RLS filter
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(StorageLocation.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(StorageLocation)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            StorageLocation.name.asc()
        )

        result = await self.db.execute(query)
        locations = result.scalars().all()

        return locations, total

    async def get_storage_location_by_id(
        self, location_id: UUID, user: User
    ) -> Optional[StorageLocation]:
        """Get storage location by ID."""
        query = (
            select(StorageLocation)
            .where(StorageLocation.id == location_id)
            .options(
                selectinload(StorageLocation.site),
                selectinload(StorageLocation.parent),
                selectinload(StorageLocation.children),
                selectinload(StorageLocation.containers),
            )
        )
        result = await self.db.execute(query)
        location = result.scalar_one_or_none()

        if location and not user.is_superuser:
            checker = PermissionChecker(user)
            if location.site_id not in checker.site_ids:
                return None

        return location

    async def create_storage_location(
        self, location_data: StorageLocationCreate, user: User
    ) -> StorageLocation:
        """Create a new storage location."""
        location = StorageLocation(
            site_id=location_data.site_id,
            parent_location_id=location_data.parent_location_id,
            name=location_data.name,
            code=location_data.code,
            location_type=location_data.location_type,
            description=location_data.description,
            floor=location_data.floor,
            building=location_data.building,
            temperature_controlled=location_data.temperature_controlled,
            temperature_min=location_data.temperature_min,
            temperature_max=location_data.temperature_max,
            humidity_controlled=location_data.humidity_controlled,
            access_restricted=location_data.access_restricted,
            capacity_cubic_meters=location_data.capacity_cubic_meters,
            status="ACTIVE",
            created_by=user.id,
        )
        self.db.add(location)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="storage_locations",
            record_id=location.id,
            user_id=user.id,
            new_values=location_data.model_dump(mode="json"),
        )

        await self.db.commit()
        await self.db.refresh(location)
        return location

    async def update_storage_location(
        self,
        location_id: UUID,
        location_data: StorageLocationUpdate,
        user: User,
    ) -> Optional[StorageLocation]:
        """Update a storage location."""
        location = await self.get_storage_location_by_id(location_id, user)
        if not location:
            return None

        update_data = location_data.model_dump(exclude_unset=True)

        # Map schema field 'metadata' to model field 'meta_data'
        if "metadata" in update_data:
            update_data["meta_data"] = update_data.pop("metadata")

        old_values = {}
        for key in update_data.keys():
            old_values[key] = getattr(location, key, None)

        for key, value in update_data.items():
            setattr(location, key, value)

        location.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="storage_locations",
            record_id=location.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        await self.db.refresh(location)
        return location

    # ──────────────────────────────────────────────
    # Containers
    # ──────────────────────────────────────────────

    async def get_containers(
        self,
        location_id: Optional[UUID] = None,
        container_type: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[Container], int]:
        """Get containers with filters and pagination."""
        query = select(Container).options(
            selectinload(Container.location),
            selectinload(Container.children),
        )

        filters = []
        if location_id:
            filters.append(Container.location_id == location_id)
        if container_type:
            filters.append(Container.container_type == container_type)
        if status:
            filters.append(Container.status == status)

        # RLS filter via location's site
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            query = query.join(StorageLocation)
            filters.append(StorageLocation.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(Container)
        if user and not user.is_superuser:
            count_query = count_query.join(StorageLocation)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            Container.name.asc()
        )

        result = await self.db.execute(query)
        containers = result.scalars().all()

        return containers, total

    async def get_container_by_id(
        self, container_id: UUID, user: User
    ) -> Optional[Container]:
        """Get container by ID."""
        query = (
            select(Container)
            .where(Container.id == container_id)
            .options(
                selectinload(Container.location),
                selectinload(Container.parent),
                selectinload(Container.children),
                selectinload(Container.stored_items),
            )
        )
        result = await self.db.execute(query)
        container = result.scalar_one_or_none()

        if container and not user.is_superuser:
            checker = PermissionChecker(user)
            # Check site access via location
            location = container.location
            if location and location.site_id not in checker.site_ids:
                return None

        return container

    async def create_container(
        self, container_data: ContainerCreate, user: User
    ) -> Container:
        """Create a new container."""
        container = Container(
            location_id=container_data.location_id,
            parent_container_id=container_data.parent_container_id,
            container_type=container_data.container_type,
            name=container_data.name,
            code=container_data.code,
            description=container_data.description,
            capacity_items=container_data.capacity_items,
            dimensions_cm=container_data.dimensions_cm,
            material=container_data.material,
            locked=container_data.locked,
            barcode=container_data.barcode,
            status="ACTIVE",
            created_by=user.id,
        )
        self.db.add(container)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="containers",
            record_id=container.id,
            user_id=user.id,
            new_values=container_data.model_dump(mode="json"),
        )

        await self.db.commit()
        await self.db.refresh(container)
        return container

    async def update_container(
        self,
        container_id: UUID,
        container_data: ContainerUpdate,
        user: User,
    ) -> Optional[Container]:
        """Update a container."""
        container = await self.get_container_by_id(container_id, user)
        if not container:
            return None

        update_data = container_data.model_dump(exclude_unset=True)

        # Map schema field 'metadata' to model field 'meta_data'
        if "metadata" in update_data:
            update_data["meta_data"] = update_data.pop("metadata")

        old_values = {}
        for key in update_data.keys():
            old_values[key] = getattr(container, key, None)

        for key, value in update_data.items():
            setattr(container, key, value)

        container.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="containers",
            record_id=container.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        await self.db.refresh(container)
        return container
