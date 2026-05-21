"""Equipment service."""

from datetime import date, datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from common.models import Equipment, StoredItem, User, Container
from common.schemas.equipment import EquipmentCreate, EquipmentUpdate
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class EquipmentService:
    """Service for equipment operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def get_equipment(
        self,
        study_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        equipment_type: Optional[str] = None,
        status: Optional[str] = None,
        calibration_due_before: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[Equipment], int]:
        """Get equipment with filters and pagination."""
        query = (
            select(Equipment)
            .options(
                selectinload(Equipment.study),
                selectinload(Equipment.site),
                selectinload(Equipment.container).selectinload(Container.location),
            )
        )

        filters = []
        if study_id:
            filters.append(StoredItem.study_id == study_id)
        if site_id:
            filters.append(StoredItem.site_id == site_id)
        if equipment_type:
            filters.append(Equipment.equipment_type == equipment_type)
        if status:
            filters.append(StoredItem.status == status)
        if calibration_due_before:
            filters.append(Equipment.next_calibration_date <= calibration_due_before)

        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(StoredItem.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(Equipment)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(StoredItem.created_at.desc())

        result = await self.db.execute(query)
        equipment = result.scalars().all()

        return equipment, total

    async def get_equipment_by_id(self, equipment_id: UUID, user: User) -> Optional[Equipment]:
        """Get equipment by ID."""
        query = (
            select(Equipment)
            .where(Equipment.id == equipment_id)
            .options(
                selectinload(Equipment.study),
                selectinload(Equipment.site),
                selectinload(Equipment.container).selectinload(Container.location),
            )
        )
        result = await self.db.execute(query)
        equipment = result.scalar_one_or_none()

        if equipment and not user.is_superuser:
            checker = PermissionChecker(user)
            if equipment.site_id not in checker.site_ids:
                return None

        return equipment

    async def _generate_internal_code(self) -> str:
        """Generate next EQUIP-YYYY-NNNNN code for the current year."""
        year = datetime.now().year
        prefix = f"EQUIP-{year}-"
        result = await self.db.execute(
            select(StoredItem.internal_code)
            .where(
                and_(
                    StoredItem.item_type == "EQUIPMENT",
                    StoredItem.internal_code.like(f"{prefix}%"),
                )
            )
        )
        codes = result.scalars().all()
        max_seq = 0
        for code in codes:
            try:
                seq = int(code[len(prefix):])
                if seq > max_seq:
                    max_seq = seq
            except (ValueError, TypeError):
                pass
        return f"{prefix}{max_seq + 1:05d}"

    async def create_equipment(self, equipment_data: EquipmentCreate, user: User) -> Equipment:
        """Create new equipment."""
        internal_code = equipment_data.internal_code or await self._generate_internal_code()
        equipment = Equipment(
            study_id=equipment_data.study_id,
            site_id=equipment_data.site_id,
            container_id=equipment_data.container_id,
            internal_code=internal_code,
            description=equipment_data.description,
            quantity=equipment_data.quantity,
            storage_date=equipment_data.storage_date,
            expected_retention_until=equipment_data.expected_retention_until,
            physical_condition=equipment_data.physical_condition,
            location_notes=equipment_data.location_notes,
            status="IN_STORAGE",
            created_by=user.id,
            equipment_type=equipment_data.equipment_type,
            manufacturer=equipment_data.manufacturer,
            model=equipment_data.model,
            serial_number=equipment_data.serial_number,
            calibration_required=equipment_data.calibration_required,
            last_calibration_date=equipment_data.last_calibration_date,
            next_calibration_date=equipment_data.next_calibration_date,
            maintenance_schedule=equipment_data.maintenance_schedule,
            last_maintenance_date=equipment_data.last_maintenance_date,
            warranty_expiry_date=equipment_data.warranty_expiry_date,
            purchase_date=equipment_data.purchase_date,
            purchase_cost=equipment_data.purchase_cost,
            currency=equipment_data.currency,
            operational_status=equipment_data.operational_status,
        )
        self.db.add(equipment)

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="equipment",
            record_id=equipment.id,
            user_id=user.id,
            new_values=equipment_data.model_dump(mode="json"),
        )

        await self.db.commit()

        # Reload with relationships to avoid lazy-load issues
        result = await self.db.execute(
            select(Equipment)
            .where(Equipment.id == equipment.id)
            .options(
                selectinload(Equipment.study),
                selectinload(Equipment.site),
                selectinload(Equipment.container).selectinload(Container.location),
            )
        )
        return result.scalar_one()

    async def update_equipment(
        self, equipment_id: UUID, equipment_data: EquipmentUpdate, user: User
    ) -> Optional[Equipment]:
        """Update equipment."""
        equipment = await self.get_equipment_by_id(equipment_id, user)
        if not equipment:
            return None

        update_data = equipment_data.model_dump(exclude_unset=True)
        old_values = {}

        for key, value in update_data.items():
            if hasattr(equipment, key):
                old_values[key] = getattr(equipment, key)
                setattr(equipment, key, value)

        equipment.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="equipment",
            record_id=equipment.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data,
        )

        await self.db.commit()
        await self.db.refresh(equipment)
        return equipment

    async def delete_equipment(self, equipment_id: UUID, user: User) -> bool:
        """Soft delete (archive) equipment."""
        equipment = await self.get_equipment_by_id(equipment_id, user)
        if not equipment:
            return False

        equipment.status = "ARCHIVED"
        equipment.updated_by = user.id

        await self.audit_service.log_action(
            event_type="DELETE",
            table_name="equipment",
            record_id=equipment.id,
            user_id=user.id,
            action="Equipment archived",
        )

        await self.db.commit()
        return True
