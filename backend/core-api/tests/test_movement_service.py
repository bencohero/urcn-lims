"""Tests for MovementService."""

import pytest
from datetime import date
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Container, Document, Movement, StoredItem, User
from common.schemas.movement import MovementCreate
from app.services.movement_service import MovementService


@pytest.mark.asyncio
class TestMovementServiceGetMovements:
    """Tests for MovementService.get_movements."""

    async def test_get_movements_empty(self, db: AsyncSession, admin_user: User):
        service = MovementService(db)
        movements, total = await service.get_movements(user=admin_user)
        assert total == 0

    async def test_get_movements_filter_by_type(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        # Create a movement first
        service = MovementService(db)
        data = MovementCreate(
            stored_item_id=stored_item_document.id,
            movement_type="OUT",
            reason="Test checkout",
        )
        await service.create_movement(data, admin_user)

        movements, total = await service.get_movements(movement_type="OUT", user=admin_user)
        assert total == 1

        movements, total = await service.get_movements(movement_type="IN", user=admin_user)
        assert total == 0


@pytest.mark.asyncio
class TestMovementServiceCreate:
    """Tests for MovementService.create_movement."""

    async def test_create_movement_out(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = MovementService(db)
        data = MovementCreate(
            stored_item_id=stored_item_document.id,
            movement_type="OUT",
            reason="Audit review",
            expected_return_date=date(2026, 3, 1),
        )
        movement = await service.create_movement(data, admin_user)
        assert movement.id is not None
        assert movement.movement_type == "OUT"
        assert movement.performed_by == admin_user.id

        # Verify stored item status was updated
        await db.refresh(stored_item_document)
        assert stored_item_document.status == "OUT"

    async def test_create_movement_transfer(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document,
        container: Container, storage_location
    ):
        # Create a second container
        new_container = Container(
            location_id=storage_location.id,
            container_type="SHELF",
            name="Shelf Z",
            capacity_items=50,
            current_count=0,
            status="ACTIVE",
        )
        db.add(new_container)
        await db.commit()
        await db.refresh(new_container)

        service = MovementService(db)
        data = MovementCreate(
            stored_item_id=stored_item_document.id,
            from_container_id=container.id,
            to_container_id=new_container.id,
            movement_type="TRANSFER",
            reason="Reorganization",
        )
        movement = await service.create_movement(data, admin_user)
        assert movement.movement_type == "TRANSFER"

        # Verify container update
        await db.refresh(stored_item_document)
        assert stored_item_document.container_id == new_container.id

    async def test_create_movement_archive(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = MovementService(db)
        data = MovementCreate(
            stored_item_id=stored_item_document.id,
            movement_type="ARCHIVE",
            reason="Study completed",
        )
        movement = await service.create_movement(data, admin_user)
        assert movement.movement_type == "ARCHIVE"

        await db.refresh(stored_item_document)
        assert stored_item_document.status == "ARCHIVED"

    async def test_create_movement_item_not_found(self, db: AsyncSession, admin_user: User):
        service = MovementService(db)
        data = MovementCreate(
            stored_item_id=uuid4(),
            movement_type="OUT",
            reason="Test",
        )
        with pytest.raises(HTTPException) as exc_info:
            await service.create_movement(data, admin_user)
        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
class TestMovementServiceGetById:
    """Tests for MovementService.get_movement_by_id."""

    async def test_get_movement_by_id(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = MovementService(db)
        data = MovementCreate(
            stored_item_id=stored_item_document.id,
            movement_type="OUT",
            reason="Test",
        )
        created = await service.create_movement(data, admin_user)

        result = await service.get_movement_by_id(created.id, admin_user)
        assert result is not None
        assert result.id == created.id

    async def test_get_movement_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = MovementService(db)
        result = await service.get_movement_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestMovementServiceRecordReturn:
    """Tests for MovementService.record_return."""

    async def test_record_return(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = MovementService(db)
        # First create an OUT movement
        data = MovementCreate(
            stored_item_id=stored_item_document.id,
            movement_type="OUT",
            reason="Loan",
            expected_return_date=date(2026, 3, 1),
        )
        movement = await service.create_movement(data, admin_user)

        # Record return
        result = await service.record_return(movement.id, admin_user)
        assert result is not None
        assert result.actual_return_date == date.today()

        # Item should be back IN_STORAGE
        await db.refresh(stored_item_document)
        assert stored_item_document.status == "IN_STORAGE"

    async def test_record_return_not_found(self, db: AsyncSession, admin_user: User):
        service = MovementService(db)
        result = await service.record_return(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestMovementServiceOverdue:
    """Tests for MovementService.get_overdue_movements."""

    async def test_get_overdue_movements_none(self, db: AsyncSession, admin_user: User):
        service = MovementService(db)
        overdue = await service.get_overdue_movements(admin_user)
        assert len(overdue) == 0
