"""Tests for AuditService."""

import pytest
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import User
from app.services.audit_service import AuditService


@pytest.mark.asyncio
class TestAuditServiceLogAction:
    """Tests for AuditService.log_action."""

    async def test_log_action_create(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        record_id = uuid4()
        audit = await service.log_action(
            event_type="CREATE",
            table_name="studies",
            record_id=record_id,
            user_id=admin_user.id,
            new_values={"title": "Test Study"},
        )
        await db.commit()

        assert audit.id is not None
        assert audit.event_type == "CREATE"
        assert audit.table_name == "studies"
        assert audit.record_id == record_id
        assert audit.hash_current is not None
        assert len(audit.hash_current) == 64  # SHA-256 hex length

    async def test_log_action_hash_chain(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)

        audit1 = await service.log_action(
            event_type="CREATE",
            table_name="studies",
            record_id=uuid4(),
            user_id=admin_user.id,
            new_values={"title": "Study 1"},
        )
        await db.commit()

        audit2 = await service.log_action(
            event_type="CREATE",
            table_name="studies",
            record_id=uuid4(),
            user_id=admin_user.id,
            new_values={"title": "Study 2"},
        )
        await db.commit()

        # Second record's hash_previous should be first record's hash_current
        assert audit2.hash_previous == audit1.hash_current

    async def test_log_action_with_old_values(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        audit = await service.log_action(
            event_type="UPDATE",
            table_name="studies",
            record_id=uuid4(),
            user_id=admin_user.id,
            old_values={"title": "Old Title"},
            new_values={"title": "New Title"},
        )
        await db.commit()

        assert audit.old_values == {"title": "Old Title"}
        assert audit.new_values == {"title": "New Title"}

    async def test_log_action_denormalizes_user(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        audit = await service.log_action(
            event_type="CREATE",
            table_name="test",
            record_id=uuid4(),
            user_id=admin_user.id,
        )
        await db.commit()

        assert audit.username == "admin"
        assert audit.user_full_name == "Admin User"


@pytest.mark.asyncio
class TestAuditServiceQuery:
    """Tests for AuditService.get_audit_records."""

    async def _create_records(self, service, db, admin_user):
        """Helper to create several audit records."""
        for i in range(5):
            await service.log_action(
                event_type="CREATE" if i % 2 == 0 else "UPDATE",
                table_name="studies" if i < 3 else "documents",
                record_id=uuid4(),
                user_id=admin_user.id,
                new_values={"index": i},
            )
        await db.commit()

    async def test_get_audit_records_all(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        await self._create_records(service, db, admin_user)

        records, total = await service.get_audit_records()
        assert total == 5

    async def test_get_audit_records_filter_event_type(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        await self._create_records(service, db, admin_user)

        records, total = await service.get_audit_records(event_type="CREATE")
        assert total == 3  # indices 0, 2, 4

    async def test_get_audit_records_filter_table(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        await self._create_records(service, db, admin_user)

        records, total = await service.get_audit_records(table_name="studies")
        assert total == 3

        records, total = await service.get_audit_records(table_name="documents")
        assert total == 2

    async def test_get_audit_records_pagination(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        await self._create_records(service, db, admin_user)

        records, total = await service.get_audit_records(page=1, page_size=2)
        assert total == 5
        assert len(records) == 2


@pytest.mark.asyncio
class TestAuditServiceRecordHistory:
    """Tests for AuditService.get_record_history."""

    async def test_get_record_history(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        target_id = uuid4()

        # Create -> Update -> Update
        for event in ["CREATE", "UPDATE", "UPDATE"]:
            await service.log_action(
                event_type=event,
                table_name="studies",
                record_id=target_id,
                user_id=admin_user.id,
            )
        await db.commit()

        history = await service.get_record_history("studies", target_id)
        assert len(history) == 3
        assert history[0].event_type == "CREATE"
        assert history[1].event_type == "UPDATE"

    async def test_get_record_history_empty(self, db: AsyncSession):
        service = AuditService(db)
        history = await service.get_record_history("studies", uuid4())
        assert len(history) == 0


@pytest.mark.asyncio
class TestAuditServiceIntegrity:
    """Tests for AuditService.verify_integrity."""

    async def test_verify_integrity_valid(self, db: AsyncSession, admin_user: User):
        service = AuditService(db)
        for i in range(3):
            await service.log_action(
                event_type="CREATE",
                table_name="test",
                record_id=uuid4(),
                user_id=admin_user.id,
                new_values={"i": i},
            )
        await db.commit()

        result = await service.verify_integrity()
        assert result["total_records_checked"] == 3
        assert result["integrity_valid"] is True
        assert result["broken_chain_detected"] is False

    async def test_verify_integrity_empty(self, db: AsyncSession):
        service = AuditService(db)
        result = await service.verify_integrity()
        assert result["total_records_checked"] == 0
        assert result["integrity_valid"] is True
