"""Site service."""

from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import Site, StorageLocation, User
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
        result = await self.db.execute(
            select(Site).where(Site.id == site.id)
            .options(
                selectinload(Site.principal_investigator),
                selectinload(Site.storage_locations),
            )
        )
        return result.scalar_one()

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
        result = await self.db.execute(
            select(Site).where(Site.id == site.id)
            .options(
                selectinload(Site.principal_investigator),
                selectinload(Site.storage_locations),
            )
        )
        return result.scalar_one()

    async def get_site_locations(
        self, site_id: UUID, user: User
    ) -> Optional[List[StorageLocation]]:
        """Get all storage locations for a site."""
        site = await self.get_site_by_id(site_id, user)
        if not site:
            return None
        result = await self.db.execute(
            select(StorageLocation)
            .where(StorageLocation.site_id == site_id)
            .order_by(StorageLocation.name)
        )
        return result.scalars().all()

    async def get_site_capacity(
        self, site_id: UUID, user: User
    ) -> Optional[Dict[str, Any]]:
        """Get capacity summary for a site."""
        site = await self.get_site_by_id(site_id, user)
        if not site:
            return None

        locations = site.storage_locations
        total_locations = len(locations)
        total_capacity = sum(
            float(loc.capacity_cubic_meters)
            for loc in locations
            if loc.capacity_cubic_meters is not None
        )
        avg_usage = (
            sum(float(loc.current_usage_percent) for loc in locations) / total_locations
            if total_locations > 0
            else 0.0
        )

        return {
            "site_id": str(site_id),
            "site_name": site.name,
            "total_locations": total_locations,
            "total_capacity_cubic_meters": total_capacity,
            "current_usage_percent": round(avg_usage, 2),
            "locations": [
                {
                    "id": str(loc.id),
                    "name": loc.name,
                    "code": loc.code or "",
                    "capacity_cubic_meters": float(loc.capacity_cubic_meters) if loc.capacity_cubic_meters else 0.0,
                    "current_usage_percent": float(loc.current_usage_percent),
                    "status": loc.status,
                }
                for loc in locations
            ],
        }
