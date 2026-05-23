"""Workflow service for access request management."""

from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.config import get_settings
from common.models import AccessRequest, StoredItem, User
from common.models.access_request import AccessRequestItem
from common.schemas.access_request import (
    AccessRequestApprove,
    AccessRequestCreate,
    AccessRequestExtend,
    AccessRequestReject,
    AccessRequestReturn,
)
from common.auth.permissions import PermissionChecker
from common.utils.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)

_ADMIN_ROLES = {"ADMIN", "ARCHIVIST"}


def _can_see_all(user: User) -> bool:
    if user.is_superuser:
        return True
    checker = PermissionChecker(user)
    return any(checker.has_role(r) for r in _ADMIN_ROLES)


def _base_options():
    return [
        selectinload(AccessRequest.requester),
        selectinload(AccessRequest.requester_site),
        selectinload(AccessRequest.reviewer),
        selectinload(AccessRequest.request_items).selectinload(AccessRequestItem.stored_item),
    ]


class WorkflowService:
    """Service for access request workflow management."""

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

    def _can_transition(self, current: str, target: str) -> bool:
        return target in self.VALID_TRANSITIONS.get(current, [])

    async def _load_with_relations(self, request_id: UUID) -> Optional[AccessRequest]:
        result = await self.db.execute(
            select(AccessRequest)
            .where(AccessRequest.id == request_id)
            .options(*_base_options())
        )
        return result.scalar_one_or_none()

    async def _generate_request_number(self) -> str:
        year = datetime.now().year
        prefix = f"AR-{year}-"
        result = await self.db.execute(
            select(func.count())
            .select_from(AccessRequest)
            .where(AccessRequest.request_number.like(f"{prefix}%"))
        )
        count = result.scalar() or 0
        return f"{prefix}{count + 1:04d}"

    async def get_access_requests(
        self,
        status_filter: Optional[str] = None,
        requester_id: Optional[UUID] = None,
        stored_item_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        urgency: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        user: Optional[User] = None,
    ) -> Tuple[List[AccessRequest], int]:
        filters = []

        if status_filter:
            filters.append(AccessRequest.status == status_filter)
        if requester_id:
            filters.append(AccessRequest.requester_id == requester_id)
        if stored_item_id:
            filters.append(AccessRequest.stored_item_id == stored_item_id)
        if site_id:
            filters.append(AccessRequest.requester_site_id == site_id)
        if urgency:
            filters.append(AccessRequest.urgency == urgency)
        if search:
            filters.append(
                or_(
                    AccessRequest.request_number.ilike(f"%{search}%"),
                    AccessRequest.purpose.ilike(f"%{search}%"),
                )
            )
        if from_date:
            filters.append(AccessRequest.requested_at >= datetime.fromisoformat(from_date))

        if user:
            if _can_see_all(user):
                if not user.is_superuser:
                    checker = PermissionChecker(user)
                    filters.append(AccessRequest.requester_site_id.in_(checker.site_ids))
            else:
                filters.append(AccessRequest.requester_id == user.id)

        query = select(AccessRequest).options(*_base_options())
        count_query = select(func.count()).select_from(AccessRequest)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total = (await self.db.execute(count_query)).scalar()
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(AccessRequest.requested_at.desc())
        requests = (await self.db.execute(query)).scalars().all()

        return requests, total

    async def get_access_request_by_id(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        result = await self.db.execute(
            select(AccessRequest)
            .where(AccessRequest.id == request_id)
            .options(*_base_options())
        )
        access_request = result.scalar_one_or_none()
        if not access_request:
            return None

        if not _can_see_all(user) and access_request.requester_id != user.id:
            checker = PermissionChecker(user)
            if access_request.requester_site_id not in checker.site_ids:
                return None

        return access_request

    async def create_access_request(
        self, request_data: AccessRequestCreate, user: User
    ) -> AccessRequest:
        # Validate all items exist
        for item_id in request_data.stored_item_ids:
            item_result = await self.db.execute(
                select(StoredItem).where(StoredItem.id == item_id)
            )
            if not item_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Stored item {item_id} not found",
                )

        request_number = await self._generate_request_number()

        access_request = AccessRequest(
            request_number=request_number,
            stored_item_id=request_data.stored_item_ids[0],
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
        await self.db.flush()

        for item_id in request_data.stored_item_ids:
            self.db.add(AccessRequestItem(
                access_request_id=access_request.id,
                stored_item_id=item_id,
            ))

        await self.db.commit()

        logger.info(
            "Access request created",
            request_id=str(access_request.id),
            request_number=request_number,
            requester_id=str(user.id),
        )
        return await self._load_with_relations(access_request.id)

    async def approve_request(
        self, request_id: UUID, approve_data: AccessRequestApprove, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "APPROVED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve request in status: {access_request.status}",
            )

        now = datetime.utcnow()
        access_request.status = "APPROVED"
        access_request.reviewed_by = user.id
        access_request.reviewed_at = now
        access_request.review_notes = approve_data.review_notes
        access_request.approved_duration_days = approve_data.approved_duration_days
        access_request.expected_return_date = (
            now + timedelta(days=approve_data.approved_duration_days)
        ).date()

        await self.db.commit()
        return await self._load_with_relations(access_request.id)

    async def reject_request(
        self, request_id: UUID, reject_data: AccessRequestReject, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "REJECTED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject request in status: {access_request.status}",
            )

        access_request.status = "REJECTED"
        access_request.reviewed_by = user.id
        access_request.reviewed_at = datetime.utcnow()
        access_request.review_notes = reject_data.review_notes

        await self.db.commit()
        return await self._load_with_relations(access_request.id)

    async def fulfill_request(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "FULFILLED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot fulfill request in status: {access_request.status}",
            )

        access_request.status = "FULFILLED"
        access_request.actual_access_date = datetime.utcnow()

        for req_item in access_request.request_items:
            if req_item.stored_item:
                req_item.stored_item.status = "OUT"

        await self.db.commit()
        return await self._load_with_relations(access_request.id)

    async def return_item(
        self, request_id: UUID, return_data: AccessRequestReturn, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "RETURNED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot return item for request in status: {access_request.status}",
            )

        access_request.status = "RETURNED"
        access_request.actual_return_date = return_data.actual_return_date.date()

        for req_item in access_request.request_items:
            if req_item.stored_item:
                req_item.stored_item.status = "IN_STORAGE"

        await self.db.commit()
        return await self._load_with_relations(access_request.id)

    async def request_extension(
        self, request_id: UUID, extension_data: AccessRequestExtend, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status not in ("FULFILLED", "OVERDUE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot request extension in status: {access_request.status}",
            )

        if access_request.extension_requested:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Extension already requested for this access request",
            )

        max_days = settings.ACCESS_REQUEST_MAX_EXTENSION_DAYS
        if extension_data.extension_days > max_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Extension cannot exceed {max_days} days",
            )

        access_request.extension_requested = True
        access_request.extension_days = extension_data.extension_days

        await self.db.commit()
        return await self._load_with_relations(access_request.id)

    async def approve_extension(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not access_request.extension_requested or access_request.extension_approved is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending extension to approve",
            )

        access_request.extension_approved = True
        if access_request.expected_return_date and access_request.extension_days:
            access_request.expected_return_date = (
                access_request.expected_return_date
                + timedelta(days=access_request.extension_days)
            )

        if access_request.status == "OVERDUE":
            access_request.status = "FULFILLED"

        await self.db.commit()
        return await self._load_with_relations(access_request.id)

    async def cancel_request(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if not self._can_transition(access_request.status, "CANCELLED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel request in status: {access_request.status}",
            )

        access_request.status = "CANCELLED"

        await self.db.commit()
        return await self._load_with_relations(access_request.id)
