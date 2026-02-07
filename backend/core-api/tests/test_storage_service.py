"""Tests for StorageService."""

import pytest
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Container, Site, SiteUser, StorageLocation, User
from common.schemas.storage import (
    ContainerCreate,
    ContainerUpdate,
    StorageLocationCreate,
    StorageLocationUpdate,
)
from app.services.storage_service import StorageService


@pytest.mark.asyncio
class TestStorageLocationGetAll:
    """Tests for StorageService.get_storage_locations."""

    async def test_get_locations_empty(self, db: AsyncSession, admin_user: User):
        service = StorageService(db)
        locs, total = await service.get_storage_locations(user=admin_user)
        assert total == 0

    async def test_get_locations_returns_all(
        self, db: AsyncSession, admin_user: User, storage_location: StorageLocation
    ):
        service = StorageService(db)
        locs, total = await service.get_storage_locations(user=admin_user)
        assert total == 1
        assert locs[0].id == storage_location.id

    async def test_get_locations_filter_by_site(
        self, db: AsyncSession, admin_user: User, storage_location: StorageLocation, site: Site
    ):
        service = StorageService(db)
        locs, total = await service.get_storage_locations(site_id=site.id, user=admin_user)
        assert total == 1

        locs, total = await service.get_storage_locations(site_id=uuid4(), user=admin_user)
        assert total == 0

    async def test_get_locations_filter_by_status(
        self, db: AsyncSession, admin_user: User, storage_location: StorageLocation
    ):
        service = StorageService(db)
        locs, total = await service.get_storage_locations(status="ACTIVE", user=admin_user)
        assert total == 1

        locs, total = await service.get_storage_locations(status="CLOSED", user=admin_user)
        assert total == 0

    async def test_get_locations_rls(
        self, db: AsyncSession, regular_user: User, storage_location: StorageLocation, site_user_assignment: SiteUser
    ):
        service = StorageService(db)
        locs, total = await service.get_storage_locations(user=regular_user)
        assert total == 1


@pytest.mark.asyncio
class TestStorageLocationGetById:
    """Tests for StorageService.get_storage_location_by_id."""

    async def test_get_location_by_id(
        self, db: AsyncSession, admin_user: User, storage_location: StorageLocation
    ):
        service = StorageService(db)
        result = await service.get_storage_location_by_id(storage_location.id, admin_user)
        assert result is not None
        assert result.name == "Room A-101"

    async def test_get_location_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = StorageService(db)
        result = await service.get_storage_location_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestStorageLocationCreate:
    """Tests for StorageService.create_storage_location."""

    async def test_create_location(self, db: AsyncSession, admin_user: User, site: Site):
        service = StorageService(db)
        data = StorageLocationCreate(
            site_id=site.id,
            name="Room B-201",
            code="B201",
            location_type="ROOM",
            temperature_controlled=False,
        )
        loc = await service.create_storage_location(data, admin_user)
        assert loc.id is not None
        assert loc.name == "Room B-201"
        assert loc.status == "ACTIVE"

    async def test_create_child_location(
        self, db: AsyncSession, admin_user: User, site: Site, storage_location: StorageLocation
    ):
        service = StorageService(db)
        data = StorageLocationCreate(
            site_id=site.id,
            parent_location_id=storage_location.id,
            name="Zone A",
            location_type="ZONE",
        )
        child = await service.create_storage_location(data, admin_user)
        assert child.parent_location_id == storage_location.id


@pytest.mark.asyncio
class TestStorageLocationUpdate:
    """Tests for StorageService.update_storage_location."""

    async def test_update_location(
        self, db: AsyncSession, admin_user: User, storage_location: StorageLocation
    ):
        service = StorageService(db)
        data = StorageLocationUpdate(name="Updated Room", status="MAINTENANCE")
        result = await service.update_storage_location(storage_location.id, data, admin_user)
        assert result is not None
        assert result.name == "Updated Room"
        assert result.status == "MAINTENANCE"

    async def test_update_location_not_found(self, db: AsyncSession, admin_user: User):
        service = StorageService(db)
        data = StorageLocationUpdate(name="Updated")
        result = await service.update_storage_location(uuid4(), data, admin_user)
        assert result is None


# ──────────────────────────────────────────────
# Container tests
# ──────────────────────────────────────────────

@pytest.mark.asyncio
class TestContainerGetAll:
    """Tests for StorageService.get_containers."""

    async def test_get_containers_empty(self, db: AsyncSession, admin_user: User):
        service = StorageService(db)
        containers, total = await service.get_containers(user=admin_user)
        assert total == 0

    async def test_get_containers_returns_all(
        self, db: AsyncSession, admin_user: User, container: Container
    ):
        service = StorageService(db)
        containers, total = await service.get_containers(user=admin_user)
        assert total == 1

    async def test_get_containers_filter_by_location(
        self, db: AsyncSession, admin_user: User, container: Container, storage_location: StorageLocation
    ):
        service = StorageService(db)
        containers, total = await service.get_containers(
            location_id=storage_location.id, user=admin_user
        )
        assert total == 1

    async def test_get_containers_filter_by_type(
        self, db: AsyncSession, admin_user: User, container: Container
    ):
        service = StorageService(db)
        containers, total = await service.get_containers(container_type="CABINET", user=admin_user)
        assert total == 1

        containers, total = await service.get_containers(container_type="SHELF", user=admin_user)
        assert total == 0


@pytest.mark.asyncio
class TestContainerGetById:
    """Tests for StorageService.get_container_by_id."""

    async def test_get_container_by_id(
        self, db: AsyncSession, admin_user: User, container: Container
    ):
        service = StorageService(db)
        result = await service.get_container_by_id(container.id, admin_user)
        assert result is not None
        assert result.name == "Cabinet A"

    async def test_get_container_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = StorageService(db)
        result = await service.get_container_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestContainerCreate:
    """Tests for StorageService.create_container."""

    async def test_create_container(
        self, db: AsyncSession, admin_user: User, storage_location: StorageLocation
    ):
        service = StorageService(db)
        data = ContainerCreate(
            location_id=storage_location.id,
            container_type="SHELF",
            name="Shelf B",
            code="SHELF-B",
            capacity_items=50,
        )
        c = await service.create_container(data, admin_user)
        assert c.id is not None
        assert c.container_type == "SHELF"
        assert c.status == "ACTIVE"


@pytest.mark.asyncio
class TestContainerUpdate:
    """Tests for StorageService.update_container."""

    async def test_update_container(
        self, db: AsyncSession, admin_user: User, container: Container
    ):
        service = StorageService(db)
        data = ContainerUpdate(locked=True, capacity_items=200)
        result = await service.update_container(container.id, data, admin_user)
        assert result is not None
        assert result.locked is True
        assert result.capacity_items == 200

    async def test_update_container_not_found(self, db: AsyncSession, admin_user: User):
        service = StorageService(db)
        data = ContainerUpdate(locked=True)
        result = await service.update_container(uuid4(), data, admin_user)
        assert result is None
