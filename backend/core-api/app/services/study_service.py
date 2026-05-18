"""Study service."""

from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, with_loader_criteria

from common.models import Site, Study, StoredItem, User
from common.schemas.study import StudyCreate, StudyUpdate
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class StudyService:
    """Service for study operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    def _sites_loader(self, user: User):
        """Return a selectinload for Study.sites, filtered by RLS for non-superusers."""
        loader = selectinload(Study.sites)
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            return loader, with_loader_criteria(Site, Site.id.in_(list(checker.site_ids)))
        return loader, None

    async def get_studies(
        self,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        user: User = None,
    ) -> Tuple[List[Study], int]:
        """Get studies with filters and pagination."""
        sites_loader, sites_criteria = self._sites_loader(user)
        opts = [sites_loader]
        if sites_criteria:
            opts.append(sites_criteria)
        query = select(Study).options(*opts)

        filters = []
        if status:
            filters.append(Study.status == status)
        if search:
            filters.append(
                or_(
                    Study.protocol_number.ilike(f"%{search}%"),
                    Study.title.ilike(f"%{search}%"),
                    Study.sponsor.ilike(f"%{search}%"),
                )
            )

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(Study)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Sort
        sort_column = getattr(Study, sort_by, Study.created_at)
        if sort_order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)

        result = await self.db.execute(query)
        studies = result.scalars().all()

        return studies, total

    async def get_study_by_id(self, study_id: UUID, user: User) -> Optional[Study]:
        """Get study by ID with statistics."""
        sites_loader, sites_criteria = self._sites_loader(user)
        opts = [sites_loader]
        if sites_criteria:
            opts.append(sites_criteria)
        query = (
            select(Study)
            .where(Study.id == study_id)
            .options(*opts)
        )
        result = await self.db.execute(query)
        study = result.scalar_one_or_none()

        if study:
            stats_result = await self.db.execute(
                select(StoredItem.item_type, func.count(StoredItem.id))
                .where(StoredItem.study_id == study_id)
                .group_by(StoredItem.item_type)
            )
            counts = dict(stats_result.all())
            study.__dict__['statistics'] = {
                'total_documents': counts.get('DOCUMENT', 0),
                'total_equipment': counts.get('EQUIPMENT', 0),
                'total_consumables': counts.get('CONSUMABLE', 0),
                'active_access_requests': 0,
            }

        return study

    async def create_study(self, study_data: StudyCreate, user: User) -> Study:
        """Create a new study."""
        study = Study(
            protocol_number=study_data.protocol_number,
            title=study_data.title,
            sponsor=study_data.sponsor,
            phase=study_data.phase,
            therapeutic_area=study_data.therapeutic_area,
            start_date=study_data.start_date,
            end_date=study_data.end_date,
            estimated_enrollment=study_data.estimated_enrollment,
            retention_period_years=study_data.retention_period_years,
            description=study_data.description,
            status=study_data.status,
            created_by=user.id,
        )
        self.db.add(study)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="studies",
            record_id=study.id,
            user_id=user.id,
            new_values=study_data.model_dump(mode="json"),
        )

        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise
        # Re-query to avoid lazy-load issues after commit
        result = await self.db.execute(
            select(Study).where(Study.id == study.id).options(selectinload(Study.sites))
        )
        return result.scalar_one()

    async def update_study(
        self, study_id: UUID, study_data: StudyUpdate, user: User
    ) -> Optional[Study]:
        """Update a study."""
        study = await self.get_study_by_id(study_id, user)
        if not study:
            return None

        update_data = study_data.model_dump(exclude_unset=True)
        old_values = {k: getattr(study, k, None) for k in update_data.keys()}

        for key, value in update_data.items():
            setattr(study, key, value)

        study.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="studies",
            record_id=study.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        result = await self.db.execute(
            select(Study).where(Study.id == study.id).options(selectinload(Study.sites))
        )
        return result.scalar_one()
