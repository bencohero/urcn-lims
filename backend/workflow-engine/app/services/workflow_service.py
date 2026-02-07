"""Workflow service for access request management."""

from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.config import get_settings
from common.models import AccessRequest, StoredItem, User, Movement
from common.schemas.access_request import (
    AccessRequestCreate,
    AccessRequestApprove,
    AccessRequestReject,
    AccessRequestFulfill,
    AccessRequestReturn,
    AccessRequestExtend,
)
from common.auth.permissions import PermissionChecker
from common.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


class WorkflowService:
    """Service for access request workflow management."""

    # State machine transitions
    VALID_TRANSITIONS = {
        "PENDING": ["APPROVED", "REJECTED", "CANCELLED"],
        "APPROVED": ["FULFILLED", "CANCELLED"],
        "REJECTED": [],
        "FULFILLED": ["RETURNED", "OVERDUE"],
        "RETURNED": [],
        "OVERDUE": ["RETURNED"],
        "CANCELLED": [],
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_access_requests(
        self,
        status: Optional[str] = None,
        requester_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        urgency: Optional[str] = None,
        from_date: Optional[str] = None,
        to_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[AccessRequest], int]:
        """Get access requests with filters."""
        query = select(AccessRequest).options(
            selectinload(AccessRequest.requester),
            selectinload(AccessRequest.stored_item),
            selectinload(AccessRequest.requester_site),
        )

        filters = []
        if status:
            filters.append(AccessRequest.status == status)
        if requester_id:
            filters.append(AccessRequest.requester_id == requester_id)
        if site_id:
            filters.append(AccessRequest.requester_site_id == site_id)
        if urgency:
            filters.append(AccessRequest.urgency == urgency)
        if from_date:
            filters.append(AccessRequest.requested_at >= datetime.fromisoformat(from_date))
        if to_date:
            filters.append(AccessRequest.requested_at <= datetime.fromisoformat(to_date))

        # Permission filtering
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(AccessRequest.requester_site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(AccessRequest)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination and ordering
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            AccessRequest.urgency.desc(), AccessRequest.requested_at.asc()
        )

        result = await self.db.execute(query)
        requests = result.scalars().all()

        return requests, total

    async def get_access_request_by_id(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        """Get access request by ID."""
        query = (
            select(AccessRequest)
            .where(AccessRequest.id == request_id)
            .options(
                selectinload(AccessRequest.requester),
                selectinload(AccessRequest.stored_item),
                selectinload(AccessRequest.requester_site),
                selectinload(AccessRequest.reviewer),
            )
        )
        result = await self.db.execute(query)
        access_request = result.scalar_one_or_none()

        if access_request and not user.is_superuser:
            checker = PermissionChecker(user)
            if access_request.requester_site_id not in checker.site_ids:
                return None

        return access_request

    async def create_access_request(
        self, request_data: AccessRequestCreate, user: User
    ) -> AccessRequest:
        """Create a new access request."""
        access_request = AccessRequest(
            stored_item_id=request_data.stored_item_id,
            requester_id=user.id,
            requester_site_id=request_data.requester_site_id,
            request_type=request_data.request_type,
            purpose=request_data.purpose,
            urgency=request_data.urgency,
            required_by_date=request_data.required_by_date,
            status="PENDING",
            requested_at=datetime.utcnow(),
        )
        self.db.add(access_request)
        await self.db.commit()
        await self.db.refresh(access_request)

        logger.info(
            "Access request created",
            request_id=str(access_request.id),
            request_number=access_request.request_number,
            requester_id=str(user.id),
        )

        # TODO: Send notification to archivists

        return access_request

    async def approve_request(
        self, request_id: UUID, approve_data: AccessRequestApprove, user: User
    ) -> Optional[AccessRequest]:
        """Approve an access request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "APPROVED"):
            raise ValueError(f"Cannot approve request in status {access_request.status}")

        access_request.status = "APPROVED"
        access_request.reviewed_by = user.id
        access_request.reviewed_at = datetime.utcnow()
        access_request.review_notes = approve_data.review_notes
        access_request.approved_duration_days = (
            approve_data.approved_duration_days
            or settings.ACCESS_REQUEST_DEFAULT_DURATION_DAYS
        )

        await self.db.commit()
        await self.db.refresh(access_request)

        logger.info(
            "Access request approved",
            request_id=str(request_id),
            reviewer_id=str(user.id),
        )

        return access_request

    async def reject_request(
        self, request_id: UUID, reject_data: AccessRequestReject, user: User
    ) -> Optional[AccessRequest]:
        """Reject an access request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "REJECTED"):
            raise ValueError(f"Cannot reject request in status {access_request.status}")

        access_request.status = "REJECTED"
        access_request.reviewed_by = user.id
        access_request.reviewed_at = datetime.utcnow()
        access_request.review_notes = reject_data.review_notes

        await self.db.commit()
        await self.db.refresh(access_request)

        logger.info(
            "Access request rejected",
            request_id=str(request_id),
            reviewer_id=str(user.id),
        )

        return access_request

    async def fulfill_request(
        self, request_id: UUID, fulfill_data: AccessRequestFulfill, user: User
    ) -> Optional[AccessRequest]:
        """Mark request as fulfilled (item handed out)."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "FULFILLED"):
            raise ValueError(f"Cannot fulfill request in status {access_request.status}")

        access_request.status = "FULFILLED"
        access_request.actual_access_date = (
            fulfill_data.actual_access_date or datetime.utcnow()
        )
        access_request.expected_return_date = date.today() + timedelta(
            days=access_request.approved_duration_days or settings.ACCESS_REQUEST_DEFAULT_DURATION_DAYS
        )

        # Update stored item status
        stored_item = access_request.stored_item
        if stored_item:
            stored_item.status = "OUT"

        # Create movement record
        movement = Movement(
            stored_item_id=access_request.stored_item_id,
            movement_type="OUT",
            reason=f"Access request {access_request.request_number}",
            related_access_request_id=access_request.id,
            expected_return_date=access_request.expected_return_date,
            performed_by=user.id,
            notes=fulfill_data.notes,
        )
        self.db.add(movement)

        await self.db.commit()
        await self.db.refresh(access_request)

        logger.info(
            "Access request fulfilled",
            request_id=str(request_id),
            fulfilled_by=str(user.id),
        )

        return access_request

    async def return_item(
        self, request_id: UUID, return_data: AccessRequestReturn, user: User
    ) -> Optional[AccessRequest]:
        """Record item return."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "RETURNED"):
            raise ValueError(f"Cannot return item for request in status {access_request.status}")

        access_request.status = "RETURNED"
        access_request.actual_return_date = (
            return_data.actual_return_date or date.today()
        )

        # Update stored item status
        stored_item = access_request.stored_item
        if stored_item:
            stored_item.status = "IN_STORAGE"

        # Create return movement
        movement = Movement(
            stored_item_id=access_request.stored_item_id,
            movement_type="RETURN",
            reason=f"Return for access request {access_request.request_number}",
            related_access_request_id=access_request.id,
            actual_return_date=access_request.actual_return_date,
            performed_by=user.id,
            notes=return_data.notes,
        )
        self.db.add(movement)

        await self.db.commit()
        await self.db.refresh(access_request)

        # Check if late
        was_late = False
        if access_request.expected_return_date and access_request.actual_return_date:
            was_late = access_request.actual_return_date > access_request.expected_return_date

        logger.info(
            "Item returned",
            request_id=str(request_id),
            returned_by=str(user.id),
            was_late=was_late,
        )

        return access_request

    async def request_extension(
        self, request_id: UUID, extend_data: AccessRequestExtend, user: User
    ) -> Optional[AccessRequest]:
        """Request extension for access duration."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status != "FULFILLED":
            raise ValueError("Can only request extension for fulfilled requests")

        if access_request.extension_requested:
            raise ValueError("Extension already requested")

        max_extension = settings.ACCESS_REQUEST_MAX_EXTENSION_DAYS
        if extend_data.extension_days > max_extension:
            raise ValueError(f"Extension cannot exceed {max_extension} days")

        access_request.extension_requested = True
        access_request.extension_days = extend_data.extension_days
        access_request.metadata = access_request.metadata or {}
        access_request.metadata["extension_reason"] = extend_data.extension_reason

        await self.db.commit()
        await self.db.refresh(access_request)

        logger.info(
            "Extension requested",
            request_id=str(request_id),
            requested_by=str(user.id),
            extension_days=extend_data.extension_days,
        )

        return access_request

    def _can_transition(self, current_status: str, new_status: str) -> bool:
        """Check if state transition is valid."""
        valid_next_states = self.VALID_TRANSITIONS.get(current_status, [])
        return new_status in valid_next_states
