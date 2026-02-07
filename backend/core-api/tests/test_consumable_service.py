"""Tests for ConsumableService."""

import pytest
from datetime import date
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Consumable, Site, Study, User, Container
from common.schemas.consumable import ConsumableCreate, ConsumableUpdate
from app.services.consumable_service import ConsumableService


@pytest.mark.asyncio
class TestConsumableServiceGetConsumables:
    """Tests for ConsumableService.get_consumables."""

    async def test_get_consumables_empty(self, db: AsyncSession, admin_user: User):
        service = ConsumableService(db)
        items, total = await service.get_consumables(user=admin_user)
        assert total == 0

    async def test_get_consumables_returns_all(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        items, total = await service.get_consumables(user=admin_user)
        assert total == 1

    async def test_get_consumables_filter_by_type(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        items, total = await service.get_consumables(consumable_type="TUBE", user=admin_user)
        assert total == 1

        items, total = await service.get_consumables(consumable_type="REAGENT", user=admin_user)
        assert total == 0

    async def test_get_consumables_filter_by_expiry(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        items, total = await service.get_consumables(
            expiry_before=date(2028, 1, 1), user=admin_user
        )
        assert total == 1

        items, total = await service.get_consumables(
            expiry_before=date(2026, 1, 1), user=admin_user
        )
        assert total == 0

    async def test_get_consumables_filter_by_hazardous(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        items, total = await service.get_consumables(hazardous=False, user=admin_user)
        assert total == 1

        items, total = await service.get_consumables(hazardous=True, user=admin_user)
        assert total == 0


@pytest.mark.asyncio
class TestConsumableServiceGetById:
    """Tests for ConsumableService.get_consumable_by_id."""

    async def test_get_consumable_by_id(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        result = await service.get_consumable_by_id(stored_item_consumable.id, admin_user)
        assert result is not None
        assert result.lot_number == "LOT-2026-A"

    async def test_get_consumable_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = ConsumableService(db)
        result = await service.get_consumable_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestConsumableServiceCreate:
    """Tests for ConsumableService.create_consumable."""

    async def test_create_consumable(
        self, db: AsyncSession, admin_user: User, study: Study, site: Site, container: Container
    ):
        service = ConsumableService(db)
        data = ConsumableCreate(
            study_id=study.id,
            site_id=site.id,
            container_id=container.id,
            internal_code="CONS-NEW",
            description="Reagent kit",
            quantity=10,
            unit="BOX",
            storage_date=date(2026, 2, 1),
            physical_condition="GOOD",
            consumable_type="REAGENT",
            manufacturer="Roche",
            catalog_number="CAT-1111",
            lot_number="LOT-NEW",
            expiry_date=date(2027, 1, 1),
            storage_conditions="2-8°C",
            hazardous=True,
            hazard_classification="H315",
            minimum_stock_level=5,
            reorder_point=10,
        )
        cons = await service.create_consumable(data, admin_user)
        assert cons.id is not None
        assert cons.consumable_type == "REAGENT"
        assert cons.hazardous is True


@pytest.mark.asyncio
class TestConsumableServiceUpdate:
    """Tests for ConsumableService.update_consumable."""

    async def test_update_consumable(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        data = ConsumableUpdate(minimum_stock_level=20)
        result = await service.update_consumable(stored_item_consumable.id, data, admin_user)
        assert result is not None
        assert result.minimum_stock_level == 20


@pytest.mark.asyncio
class TestConsumableServiceDelete:
    """Tests for ConsumableService.delete_consumable."""

    async def test_delete_consumable(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = ConsumableService(db)
        success = await service.delete_consumable(stored_item_consumable.id, admin_user)
        assert success is True

        result = await service.get_consumable_by_id(stored_item_consumable.id, admin_user)
        assert result.status == "ARCHIVED"

    async def test_delete_consumable_not_found(self, db: AsyncSession, admin_user: User):
        service = ConsumableService(db)
        success = await service.delete_consumable(uuid4(), admin_user)
        assert success is False
