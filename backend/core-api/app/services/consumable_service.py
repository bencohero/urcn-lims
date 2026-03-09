"""Consumable service."""

from datetime import date
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from common.models import Consumable, StoredItem, User
from common.schemas.consumable import ConsumableCreate, ConsumableUpdate
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class ConsumableService:
    """Service for consumable operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def get_consumables(
        self,
        study_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        consumable_type: Optional[str] = None,
        expiry_before: Optional[date] = None,
        hazardous: Optional[bool] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[Consumable], int]:
        """Get consumables with filters and pagination."""
        query = (
            select(Consumable)
            .options(
                selectinload(Consumable.study),
                selectinload(Consumable.site),
                selectinload(Consumable.container),
            )
        )

        filters = []
        if study_id:
            filters.append(StoredItem.study_id == study_id)
        if site_id:
            filters.append(StoredItem.site_id == site_id)
        if consumable_type:
            filters.append(Consumable.consumable_type == consumable_type)
        if expiry_before:
            filters.append(Consumable.expiry_date <= expiry_before)
        if hazardous is not None:
            filters.append(Consumable.hazardous == hazardous)

        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(StoredItem.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(Consumable)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(StoredItem.created_at.desc())

        result = await self.db.execute(query)
        consumables = result.scalars().all()

        return consumables, total

    async def get_consumable_by_id(self, consumable_id: UUID, user: User) -> Optional[Consumable]:
        """Get consumable by ID."""
        query = (
            select(Consumable)
            .where(Consumable.id == consumable_id)
            .options(
                selectinload(Consumable.study),
                selectinload(Consumable.site),
                selectinload(Consumable.container),
            )
        )
        result = await self.db.execute(query)
        consumable = result.scalar_one_or_none()

        if consumable and not user.is_superuser:
            checker = PermissionChecker(user)
            if consumable.site_id not in checker.site_ids:
                return None

        return consumable

    async def create_consumable(self, consumable_data: ConsumableCreate, user: User) -> Consumable:
        """Create new consumable."""
        consumable = Consumable(
            study_id=consumable_data.study_id,
            site_id=consumable_data.site_id,
            container_id=consumable_data.container_id,
            internal_code=consumable_data.internal_code,
            description=consumable_data.description,
            quantity=consumable_data.quantity,
            unit=consumable_data.unit,
            storage_date=consumable_data.storage_date,
            expected_retention_until=consumable_data.expected_retention_until,
            physical_condition=consumable_data.physical_condition,
            location_notes=consumable_data.location_notes,
            status="IN_STORAGE",
            created_by=user.id,
            consumable_type=consumable_data.consumable_type,
            manufacturer=consumable_data.manufacturer,
            catalog_number=consumable_data.catalog_number,
            lot_number=consumable_data.lot_number,
            expiry_date=consumable_data.expiry_date,
            storage_conditions=consumable_data.storage_conditions,
            hazardous=consumable_data.hazardous,
            hazard_classification=consumable_data.hazard_classification,
            minimum_stock_level=consumable_data.minimum_stock_level,
            reorder_point=consumable_data.reorder_point,
        )
        self.db.add(consumable)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="consumables",
            record_id=consumable.id,
            user_id=user.id,
            new_values=consumable_data.model_dump(mode="json"),
        )

        await self.db.commit()

        # Reload with relationships to avoid lazy-load issues
        result = await self.db.execute(
            select(Consumable)
            .where(Consumable.id == consumable.id)
            .options(
                selectinload(Consumable.study),
                selectinload(Consumable.site),
                selectinload(Consumable.container),
            )
        )
        return result.scalar_one()

    async def update_consumable(
        self, consumable_id: UUID, consumable_data: ConsumableUpdate, user: User
    ) -> Optional[Consumable]:
        """Update consumable."""
        consumable = await self.get_consumable_by_id(consumable_id, user)
        if not consumable:
            return None

        update_data = consumable_data.model_dump(exclude_unset=True)
        old_values = {}

        for key, value in update_data.items():
            if hasattr(consumable, key):
                old_values[key] = getattr(consumable, key)
                setattr(consumable, key, value)

        consumable.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="consumables",
            record_id=consumable.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        await self.db.refresh(consumable)
        return consumable

    async def delete_consumable(self, consumable_id: UUID, user: User) -> bool:
        """Soft delete (archive) consumable."""
        consumable = await self.get_consumable_by_id(consumable_id, user)
        if not consumable:
            return False

        consumable.status = "ARCHIVED"
        consumable.updated_by = user.id

        await self.audit_service.log_action(
            event_type="DELETE",
            table_name="consumables",
            record_id=consumable.id,
            user_id=user.id,
            action="Consumable archived",
        )

        await self.db.commit()
        return True
