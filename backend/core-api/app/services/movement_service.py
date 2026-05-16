"""Movement service for tracking physical item movements."""

from datetime import date, datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import Container, Movement, StoredItem, User
from common.schemas.movement import MovementCreate
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class MovementService:
    """Service for item movement operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def _load_with_relations(self, movement_id: UUID) -> Optional[Movement]:
        """Reload a movement with all relationships eagerly loaded."""
        result = await self.db.execute(
            select(Movement)
            .where(Movement.id == movement_id)
            .options(
                selectinload(Movement.stored_item),
                selectinload(Movement.performer),
                selectinload(Movement.approver),
                selectinload(Movement.from_container),
                selectinload(Movement.to_container),
                selectinload(Movement.from_location),
                selectinload(Movement.to_location),
            )
        )
        return result.scalar_one_or_none()

    async def get_movements(
        self,
        stored_item_id: Optional[UUID] = None,
        movement_type: Optional[str] = None,
        performed_by_id: Optional[UUID] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[Movement], int]:
        """Get movements with filters and pagination."""
        query = select(Movement).options(
            selectinload(Movement.stored_item),
            selectinload(Movement.performer),
            selectinload(Movement.approver),
            selectinload(Movement.from_container),
            selectinload(Movement.to_container),
            selectinload(Movement.from_location),
            selectinload(Movement.to_location),
        )

        filters = []
        if stored_item_id:
            filters.append(Movement.stored_item_id == stored_item_id)
        if movement_type:
            filters.append(Movement.movement_type == movement_type)
        if performed_by_id:
            filters.append(Movement.performed_by == performed_by_id)
        if from_date:
            filters.append(Movement.movement_date >= datetime.combine(from_date, datetime.min.time()))
        if to_date:
            filters.append(Movement.movement_date <= datetime.combine(to_date, datetime.max.time()))

        # RLS filter via stored_item's site
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            query = query.join(StoredItem)
            filters.append(StoredItem.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(Movement)
        if user and not user.is_superuser:
            count_query = count_query.join(StoredItem)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            Movement.movement_date.desc()
        )

        result = await self.db.execute(query)
        movements = result.scalars().all()

        return movements, total

    async def get_movement_by_id(
        self, movement_id: UUID, user: User
    ) -> Optional[Movement]:
        """Get movement by ID."""
        query = (
            select(Movement)
            .where(Movement.id == movement_id)
            .options(
                selectinload(Movement.stored_item),
                selectinload(Movement.performer),
                selectinload(Movement.approver),
                selectinload(Movement.from_container),
                selectinload(Movement.to_container),
                selectinload(Movement.from_location),
                selectinload(Movement.to_location),
            )
        )
        result = await self.db.execute(query)
        movement = result.scalar_one_or_none()

        if movement and not user.is_superuser:
            checker = PermissionChecker(user)
            item = movement.stored_item
            if item and item.site_id not in checker.site_ids:
                return None

        return movement

    async def create_movement(
        self, movement_data: MovementCreate, user: User
    ) -> Movement:
        """Create a new movement and update item/container state."""
        # Verify stored item exists
        item_query = select(StoredItem).where(StoredItem.id == movement_data.stored_item_id)
        item_result = await self.db.execute(item_query)
        stored_item = item_result.scalar_one_or_none()
        if not stored_item:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stored item not found",
            )

        movement = Movement(
            stored_item_id=movement_data.stored_item_id,
            from_container_id=movement_data.from_container_id,
            to_container_id=movement_data.to_container_id,
            from_location_id=movement_data.from_location_id,
            to_location_id=movement_data.to_location_id,
            related_access_request_id=movement_data.related_access_request_id,
            movement_type=movement_data.movement_type,
            quantity=movement_data.quantity,
            reason=movement_data.reason,
            expected_return_date=movement_data.expected_return_date,
            notes=movement_data.notes,
            performed_by=movement_data.performed_by_id or user.id,
            movement_date=datetime.utcnow(),
        )
        self.db.add(movement)

        # Update stored item status based on movement type
        status_map = {
            "IN": "IN_STORAGE",
            "OUT": "OUT",
            "TRANSFER": "IN_STORAGE",
            "RETURN": "IN_STORAGE",
            "ARCHIVE": "ARCHIVED",
            "DESTROY": "DESTROYED",
        }
        new_status = status_map.get(movement_data.movement_type)
        if new_status:
            stored_item.status = new_status

        # Update container if transferring to a new container
        if movement_data.to_container_id:
            stored_item.container_id = movement_data.to_container_id

            # Decrement old container count
            if movement_data.from_container_id:
                old_container = await self.db.get(Container, movement_data.from_container_id)
                if old_container and old_container.current_count > 0:
                    old_container.current_count -= movement_data.quantity

            # Increment new container count
            new_container = await self.db.get(Container, movement_data.to_container_id)
            if new_container:
                new_container.current_count += movement_data.quantity

        # For OUT movements, decrement container count
        if movement_data.movement_type == "OUT" and movement_data.from_container_id:
            from_container = await self.db.get(Container, movement_data.from_container_id)
            if from_container and from_container.current_count > 0:
                from_container.current_count -= movement_data.quantity

        # For RETURN, increment container count
        if movement_data.movement_type == "RETURN" and movement_data.to_container_id:
            # Container count already handled above
            pass

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="movements",
            record_id=movement.id,
            user_id=user.id,
            new_values=movement_data.model_dump(mode="json"),
            action=f"Movement {movement_data.movement_type} for item {movement_data.stored_item_id}",
        )

        await self.db.commit()
        return await self._load_with_relations(movement.id)

    async def get_overdue_movements(
        self, user: User
    ) -> List[Movement]:
        """Get movements with overdue returns."""
        query = (
            select(Movement)
            .where(
                and_(
                    Movement.expected_return_date.isnot(None),
                    Movement.actual_return_date.is_(None),
                    Movement.expected_return_date < date.today(),
                    Movement.movement_type.in_(["OUT", "TRANSFER"]),
                )
            )
            .options(
                selectinload(Movement.stored_item),
                selectinload(Movement.performer),
            )
            .order_by(Movement.expected_return_date.asc())
        )

        if not user.is_superuser:
            checker = PermissionChecker(user)
            query = query.join(StoredItem).where(
                StoredItem.site_id.in_(checker.site_ids)
            )

        result = await self.db.execute(query)
        return result.scalars().all()

    async def record_return(
        self, movement_id: UUID, user: User
    ) -> Optional[Movement]:
        """Record the return of an item from an outgoing movement."""
        movement = await self.get_movement_by_id(movement_id, user)
        if not movement:
            return None

        movement.actual_return_date = date.today()

        # Update stored item status back to IN_STORAGE
        stored_item = movement.stored_item
        if stored_item:
            stored_item.status = "IN_STORAGE"

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="movements",
            record_id=movement.id,
            user_id=user.id,
            old_values={"actual_return_date": None},
            new_values={"actual_return_date": str(date.today())},
            action="Return recorded",
        )

        await self.db.commit()
        return await self._load_with_relations(movement.id)
