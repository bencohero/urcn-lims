"""Access request service for item access workflow."""

from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import AccessRequest, StoredItem, User
from common.schemas.access_request import (
    AccessRequestApprove,
    AccessRequestCreate,
    AccessRequestExtend,
    AccessRequestReject,
    AccessRequestReturn,
)
from common.auth.permissions import PermissionChecker
from common.config import get_settings

from .audit_service import AuditService

settings = get_settings()


class AccessRequestService:
    """Service for access request workflow operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def _generate_request_number(self) -> str:
        """Generate next sequential request number: AR-YYYY-NNNN."""
        year = datetime.utcnow().year
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
        urgency: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[AccessRequest], int]:
        """Get access requests with filters and pagination."""
        query = select(AccessRequest).options(
            selectinload(AccessRequest.stored_item),
            selectinload(AccessRequest.requester),
            selectinload(AccessRequest.requester_site),
            selectinload(AccessRequest.reviewer),
        )

        filters = []
        if status_filter:
            filters.append(AccessRequest.status == status_filter)
        if requester_id:
            filters.append(AccessRequest.requester_id == requester_id)
        if stored_item_id:
            filters.append(AccessRequest.stored_item_id == stored_item_id)
        if urgency:
            filters.append(AccessRequest.urgency == urgency)

        # RLS filter
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

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            AccessRequest.requested_at.desc()
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
                selectinload(AccessRequest.stored_item),
                selectinload(AccessRequest.requester),
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
        # Verify stored item exists
        item_result = await self.db.execute(
            select(StoredItem).where(StoredItem.id == request_data.stored_item_id)
        )
        stored_item = item_result.scalar_one_or_none()
        if not stored_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stored item not found",
            )

        request_number = await self._generate_request_number()

        access_request = AccessRequest(
            request_number=request_number,
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

        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            new_values=request_data.model_dump(mode="json"),
            action=f"Access request {request_number} created",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def approve_request(
        self, request_id: UUID, approval_data: AccessRequestApprove, user: User
    ) -> Optional[AccessRequest]:
        """Approve an access request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve request in status: {access_request.status}",
            )

        now = datetime.utcnow()
        access_request.status = "APPROVED"
        access_request.reviewed_by = user.id
        access_request.reviewed_at = now
        access_request.review_notes = approval_data.review_notes
        access_request.approved_duration_days = approval_data.approved_duration_days
        access_request.expected_return_date = (
            now + timedelta(days=approval_data.approved_duration_days)
        ).date()

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"status": "PENDING"},
            new_values={
                "status": "APPROVED",
                "approved_duration_days": approval_data.approved_duration_days,
            },
            action=f"Access request {access_request.request_number} approved",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def reject_request(
        self, request_id: UUID, rejection_data: AccessRequestReject, user: User
    ) -> Optional[AccessRequest]:
        """Reject an access request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject request in status: {access_request.status}",
            )

        access_request.status = "REJECTED"
        access_request.reviewed_by = user.id
        access_request.reviewed_at = datetime.utcnow()
        access_request.review_notes = rejection_data.review_notes

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"status": "PENDING"},
            new_values={"status": "REJECTED", "review_notes": rejection_data.review_notes},
            action=f"Access request {access_request.request_number} rejected",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def fulfill_request(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        """Mark an approved request as fulfilled (item handed over)."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot fulfill request in status: {access_request.status}",
            )

        access_request.status = "FULFILLED"
        access_request.actual_access_date = datetime.utcnow()

        # Update stored item status
        stored_item = access_request.stored_item
        if stored_item:
            stored_item.status = "OUT"

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"status": "APPROVED"},
            new_values={"status": "FULFILLED"},
            action=f"Access request {access_request.request_number} fulfilled",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def return_item(
        self, request_id: UUID, return_data: AccessRequestReturn, user: User
    ) -> Optional[AccessRequest]:
        """Record item return for a fulfilled request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status not in ("FULFILLED", "OVERDUE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot return item for request in status: {access_request.status}",
            )

        access_request.status = "RETURNED"
        access_request.actual_return_date = return_data.actual_return_date.date()

        # Update stored item status back
        stored_item = access_request.stored_item
        if stored_item:
            stored_item.status = "IN_STORAGE"

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"status": access_request.status},
            new_values={"status": "RETURNED", "actual_return_date": str(return_data.actual_return_date)},
            action=f"Item returned for request {access_request.request_number}",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def request_extension(
        self, request_id: UUID, extension_data: AccessRequestExtend, user: User
    ) -> Optional[AccessRequest]:
        """Request an extension for a fulfilled access request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status not in ("FULFILLED", "OVERDUE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot request extension for status: {access_request.status}",
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

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"extension_requested": False},
            new_values={
                "extension_requested": True,
                "extension_days": extension_data.extension_days,
            },
            action=f"Extension requested for {access_request.request_number}",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def approve_extension(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        """Approve an extension request."""
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

        # If was overdue, revert to fulfilled
        if access_request.status == "OVERDUE":
            access_request.status = "FULFILLED"

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"extension_approved": None},
            new_values={"extension_approved": True},
            action=f"Extension approved for {access_request.request_number}",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request

    async def cancel_request(
        self, request_id: UUID, user: User
    ) -> Optional[AccessRequest]:
        """Cancel a pending access request."""
        access_request = await self.get_access_request_by_id(request_id, user)
        if not access_request:
            return None

        if access_request.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel request in status: {access_request.status}",
            )

        access_request.status = "CANCELLED"

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="access_requests",
            record_id=access_request.id,
            user_id=user.id,
            old_values={"status": "PENDING"},
            new_values={"status": "CANCELLED"},
            action=f"Access request {access_request.request_number} cancelled",
        )

        await self.db.commit()
        await self.db.refresh(access_request)
        return access_request
