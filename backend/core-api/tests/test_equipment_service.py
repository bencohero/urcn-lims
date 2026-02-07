"""Tests for EquipmentService."""

import pytest
from datetime import date
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Equipment, Site, Study, User, Container
from common.schemas.equipment import EquipmentCreate, EquipmentUpdate
from app.services.equipment_service import EquipmentService


@pytest.mark.asyncio
class TestEquipmentServiceGetEquipment:
    """Tests for EquipmentService.get_equipment."""

    async def test_get_equipment_empty(self, db: AsyncSession, admin_user: User):
        service = EquipmentService(db)
        items, total = await service.get_equipment(user=admin_user)
        assert total == 0

    async def test_get_equipment_returns_all(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = EquipmentService(db)
        items, total = await service.get_equipment(user=admin_user)
        assert total == 1
        assert items[0].id == stored_item_equipment.id

    async def test_get_equipment_filter_by_type(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = EquipmentService(db)
        items, total = await service.get_equipment(equipment_type="CENTRIFUGE", user=admin_user)
        assert total == 1

        items, total = await service.get_equipment(equipment_type="REFRIGERATOR", user=admin_user)
        assert total == 0

    async def test_get_equipment_filter_calibration_due(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = EquipmentService(db)
        items, total = await service.get_equipment(
            calibration_due_before=date(2026, 12, 31), user=admin_user
        )
        assert total == 1

        items, total = await service.get_equipment(
            calibration_due_before=date(2026, 1, 1), user=admin_user
        )
        assert total == 0


@pytest.mark.asyncio
class TestEquipmentServiceGetById:
    """Tests for EquipmentService.get_equipment_by_id."""

    async def test_get_equipment_by_id(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = EquipmentService(db)
        result = await service.get_equipment_by_id(stored_item_equipment.id, admin_user)
        assert result is not None
        assert result.serial_number == "SN-12345"

    async def test_get_equipment_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = EquipmentService(db)
        result = await service.get_equipment_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestEquipmentServiceCreate:
    """Tests for EquipmentService.create_equipment."""

    async def test_create_equipment(
        self, db: AsyncSession, admin_user: User, study: Study, site: Site, container: Container
    ):
        service = EquipmentService(db)
        data = EquipmentCreate(
            study_id=study.id,
            site_id=site.id,
            container_id=container.id,
            internal_code="EQ-NEW",
            description="New refrigerator",
            quantity=1,
            storage_date=date(2026, 2, 1),
            physical_condition="GOOD",
            equipment_type="REFRIGERATOR",
            manufacturer="Thermo Fisher",
            model="TSX600",
            serial_number="SN-99999",
            calibration_required=True,
            next_calibration_date=date(2026, 8, 1),
            operational_status="OPERATIONAL",
        )
        eq = await service.create_equipment(data, admin_user)
        assert eq.id is not None
        assert eq.equipment_type == "REFRIGERATOR"
        assert eq.serial_number == "SN-99999"


@pytest.mark.asyncio
class TestEquipmentServiceUpdate:
    """Tests for EquipmentService.update_equipment."""

    async def test_update_equipment(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = EquipmentService(db)
        data = EquipmentUpdate(operational_status="MAINTENANCE")
        result = await service.update_equipment(stored_item_equipment.id, data, admin_user)
        assert result is not None
        assert result.operational_status == "MAINTENANCE"

    async def test_update_equipment_not_found(self, db: AsyncSession, admin_user: User):
        service = EquipmentService(db)
        data = EquipmentUpdate(operational_status="MAINTENANCE")
        result = await service.update_equipment(uuid4(), data, admin_user)
        assert result is None


@pytest.mark.asyncio
class TestEquipmentServiceDelete:
    """Tests for EquipmentService.delete_equipment."""

    async def test_delete_equipment(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = EquipmentService(db)
        success = await service.delete_equipment(stored_item_equipment.id, admin_user)
        assert success is True

        result = await service.get_equipment_by_id(stored_item_equipment.id, admin_user)
        assert result.status == "ARCHIVED"

    async def test_delete_equipment_not_found(self, db: AsyncSession, admin_user: User):
        service = EquipmentService(db)
        success = await service.delete_equipment(uuid4(), admin_user)
        assert success is False
