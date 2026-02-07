"""Tests for SiteService."""

import pytest
import pytest_asyncio
from datetime import date
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Site, SiteUser, Study, User
from common.schemas.site import SiteCreate, SiteUpdate
from app.services.site_service import SiteService


@pytest.mark.asyncio
class TestSiteServiceGetSites:
    """Tests for SiteService.get_sites."""

    async def test_get_sites_as_superuser(self, db: AsyncSession, admin_user: User, site: Site):
        service = SiteService(db)
        sites, total = await service.get_sites(user=admin_user)
        assert total == 1
        assert sites[0].id == site.id

    async def test_get_sites_filter_by_study(self, db: AsyncSession, admin_user: User, site: Site, study: Study):
        service = SiteService(db)
        sites, total = await service.get_sites(study_id=study.id, user=admin_user)
        assert total == 1

        sites, total = await service.get_sites(study_id=uuid4(), user=admin_user)
        assert total == 0

    async def test_get_sites_filter_by_country(self, db: AsyncSession, admin_user: User, site: Site):
        service = SiteService(db)
        sites, total = await service.get_sites(country="France", user=admin_user)
        assert total == 1

        sites, total = await service.get_sites(country="Germany", user=admin_user)
        assert total == 0

    async def test_get_sites_rls_filter(
        self, db: AsyncSession, regular_user: User, site: Site, site_user_assignment: SiteUser
    ):
        """Non-superuser should only see sites they're assigned to."""
        service = SiteService(db)
        sites, total = await service.get_sites(user=regular_user)
        assert total == 1
        assert sites[0].id == site.id


@pytest.mark.asyncio
class TestSiteServiceGetById:
    """Tests for SiteService.get_site_by_id."""

    async def test_get_site_by_id(self, db: AsyncSession, admin_user: User, site: Site):
        service = SiteService(db)
        result = await service.get_site_by_id(site.id, admin_user)
        assert result is not None
        assert result.site_number == "SITE-001"

    async def test_get_site_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = SiteService(db)
        result = await service.get_site_by_id(uuid4(), admin_user)
        assert result is None

    async def test_get_site_by_id_rls_denied(
        self, db: AsyncSession, regular_user: User, study: Study
    ):
        """Non-superuser without site access should get None."""
        # Create a site the user is NOT assigned to
        other_site = Site(
            study_id=study.id,
            site_number="SITE-999",
            name="Other Hospital",
            country="Germany",
            city="Berlin",
            status="ACTIVE",
        )
        db.add(other_site)
        await db.commit()
        await db.refresh(other_site)

        service = SiteService(db)
        result = await service.get_site_by_id(other_site.id, regular_user)
        assert result is None


@pytest.mark.asyncio
class TestSiteServiceCreate:
    """Tests for SiteService.create_site."""

    async def test_create_site(self, db: AsyncSession, admin_user: User, study: Study):
        service = SiteService(db)
        data = SiteCreate(
            study_id=study.id,
            site_number="SITE-NEW",
            name="New Hospital",
            country="Spain",
            city="Madrid",
            status="ACTIVE",
        )
        site = await service.create_site(data, admin_user)
        assert site.id is not None
        assert site.site_number == "SITE-NEW"
        assert site.created_by == admin_user.id


@pytest.mark.asyncio
class TestSiteServiceUpdate:
    """Tests for SiteService.update_site."""

    async def test_update_site(self, db: AsyncSession, admin_user: User, site: Site):
        service = SiteService(db)
        data = SiteUpdate(name="Updated Hospital", status="INACTIVE")
        result = await service.update_site(site.id, data, admin_user)
        assert result is not None
        assert result.name == "Updated Hospital"
        assert result.status == "INACTIVE"

    async def test_update_site_not_found(self, db: AsyncSession, admin_user: User):
        service = SiteService(db)
        data = SiteUpdate(name="Updated")
        result = await service.update_site(uuid4(), data, admin_user)
        assert result is None
