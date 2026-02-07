"""Site service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import Site, User
from common.schemas.site import SiteCreate, SiteUpdate
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class SiteService:
    """Service for site operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def get_sites(
        self,
        study_id: Optional[UUID] = None,
        status: Optional[str] = None,
        country: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[Site], int]:
        """Get sites with filters and pagination."""
        query = select(Site).options(
            selectinload(Site.study),
            selectinload(Site.principal_investigator),
        )

        filters = []
        if study_id:
            filters.append(Site.study_id == study_id)
        if status:
            filters.append(Site.status == status)
        if country:
            filters.append(Site.country == country)

        # RLS filter
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(Site.id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(Site)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Site.site_number)

        result = await self.db.execute(query)
        sites = result.scalars().all()

        return sites, total

    async def get_site_by_id(self, site_id: UUID, user: User) -> Optional[Site]:
        """Get site by ID."""
        query = (
            select(Site)
            .where(Site.id == site_id)
            .options(
                selectinload(Site.study),
                selectinload(Site.principal_investigator),
                selectinload(Site.storage_locations),
            )
        )
        result = await self.db.execute(query)
        site = result.scalar_one_or_none()

        if site and not user.is_superuser:
            checker = PermissionChecker(user)
            if site.id not in checker.site_ids:
                return None

        return site

    async def create_site(self, site_data: SiteCreate, user: User) -> Site:
        """Create a new site."""
        site = Site(
            study_id=site_data.study_id,
            site_number=site_data.site_number,
            name=site_data.name,
            country=site_data.country,
            city=site_data.city,
            address=site_data.address,
            postal_code=site_data.postal_code,
            phone=site_data.phone,
            email=site_data.email,
            principal_investigator_id=site_data.principal_investigator_id,
            activation_date=site_data.activation_date,
            status=site_data.status,
            has_offline_capability=site_data.has_offline_capability,
            timezone=site_data.timezone,
            created_by=user.id,
        )
        self.db.add(site)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="sites",
            record_id=site.id,
            user_id=user.id,
            new_values=site_data.model_dump(mode="json"),
        )

        await self.db.commit()
        await self.db.refresh(site)
        return site

    async def update_site(
        self, site_id: UUID, site_data: SiteUpdate, user: User
    ) -> Optional[Site]:
        """Update a site."""
        site = await self.get_site_by_id(site_id, user)
        if not site:
            return None

        update_data = site_data.model_dump(exclude_unset=True)
        old_values = {k: getattr(site, k) for k in update_data.keys()}

        for key, value in update_data.items():
            setattr(site, key, value)

        site.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="sites",
            record_id=site.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        await self.db.refresh(site)
        return site
