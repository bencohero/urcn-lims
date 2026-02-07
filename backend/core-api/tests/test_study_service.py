"""Tests for StudyService."""

import pytest
import pytest_asyncio
from datetime import date
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Study, User
from common.schemas.study import StudyCreate, StudyUpdate
from app.services.study_service import StudyService


@pytest.mark.asyncio
class TestStudyServiceGetStudies:
    """Tests for StudyService.get_studies."""

    async def test_get_studies_empty(self, db: AsyncSession, admin_user: User):
        service = StudyService(db)
        studies, total = await service.get_studies(user=admin_user)
        assert total == 0
        assert studies == []

    async def test_get_studies_returns_all(self, db: AsyncSession, admin_user: User, study: Study):
        service = StudyService(db)
        studies, total = await service.get_studies(user=admin_user)
        assert total == 1
        assert studies[0].id == study.id

    async def test_get_studies_filter_by_status(self, db: AsyncSession, admin_user: User, study: Study):
        service = StudyService(db)
        studies, total = await service.get_studies(status="ACTIVE", user=admin_user)
        assert total == 1

        studies, total = await service.get_studies(status="COMPLETED", user=admin_user)
        assert total == 0

    async def test_get_studies_search(self, db: AsyncSession, admin_user: User, study: Study):
        service = StudyService(db)
        studies, total = await service.get_studies(search="PROTO", user=admin_user)
        assert total == 1

        studies, total = await service.get_studies(search="nonexistent", user=admin_user)
        assert total == 0

    async def test_get_studies_pagination(self, db: AsyncSession, admin_user: User):
        # Create 3 studies
        for i in range(3):
            s = Study(
                protocol_number=f"PROTO-{i:03d}",
                title=f"Study {i}",
                status="ACTIVE",
            )
            db.add(s)
        await db.commit()

        service = StudyService(db)
        studies, total = await service.get_studies(page=1, page_size=2, user=admin_user)
        assert total == 3
        assert len(studies) == 2

        studies, total = await service.get_studies(page=2, page_size=2, user=admin_user)
        assert len(studies) == 1


@pytest.mark.asyncio
class TestStudyServiceGetById:
    """Tests for StudyService.get_study_by_id."""

    async def test_get_study_by_id_found(self, db: AsyncSession, admin_user: User, study: Study):
        service = StudyService(db)
        result = await service.get_study_by_id(study.id, admin_user)
        assert result is not None
        assert result.protocol_number == "PROTO-001"

    async def test_get_study_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = StudyService(db)
        result = await service.get_study_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestStudyServiceCreate:
    """Tests for StudyService.create_study."""

    async def test_create_study(self, db: AsyncSession, admin_user: User):
        service = StudyService(db)
        data = StudyCreate(
            protocol_number="NEW-PROTO-001",
            title="New Study",
            sponsor="Sponsor Inc",
            phase="Phase I",
            therapeutic_area="Cardiology",
            start_date=date(2026, 3, 1),
            status="ACTIVE",
        )
        study = await service.create_study(data, admin_user)
        assert study.id is not None
        assert study.protocol_number == "NEW-PROTO-001"
        assert study.title == "New Study"
        assert study.created_by == admin_user.id


@pytest.mark.asyncio
class TestStudyServiceUpdate:
    """Tests for StudyService.update_study."""

    async def test_update_study(self, db: AsyncSession, admin_user: User, study: Study):
        service = StudyService(db)
        data = StudyUpdate(title="Updated Title", status="PAUSED")
        result = await service.update_study(study.id, data, admin_user)
        assert result is not None
        assert result.title == "Updated Title"
        assert result.status == "PAUSED"
        assert result.updated_by == admin_user.id

    async def test_update_study_not_found(self, db: AsyncSession, admin_user: User):
        service = StudyService(db)
        data = StudyUpdate(title="Updated")
        result = await service.update_study(uuid4(), data, admin_user)
        assert result is None

    async def test_update_study_partial(self, db: AsyncSession, admin_user: User, study: Study):
        service = StudyService(db)
        data = StudyUpdate(sponsor="New Sponsor")
        result = await service.update_study(study.id, data, admin_user)
        assert result.sponsor == "New Sponsor"
        assert result.title == "Test Clinical Study"  # unchanged
