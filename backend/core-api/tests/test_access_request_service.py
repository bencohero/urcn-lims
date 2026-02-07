"""Tests for AccessRequestService."""

import pytest
from datetime import date, datetime
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import AccessRequest, Document, Site, User
from common.schemas.access_request import (
    AccessRequestApprove,
    AccessRequestCreate,
    AccessRequestExtend,
    AccessRequestReject,
    AccessRequestReturn,
)
from app.services.access_request_service import AccessRequestService


@pytest.mark.asyncio
class TestAccessRequestGetAll:
    """Tests for AccessRequestService.get_access_requests."""

    async def test_get_access_requests_empty(self, db: AsyncSession, admin_user: User):
        service = AccessRequestService(db)
        requests, total = await service.get_access_requests(user=admin_user)
        assert total == 0


@pytest.mark.asyncio
class TestAccessRequestCreate:
    """Tests for AccessRequestService.create_access_request."""

    async def test_create_access_request(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            request_type="LOAN",
            purpose="Need document for monitoring visit review",
            urgency="HIGH",
            required_by_date=date(2026, 3, 1),
        )
        ar = await service.create_access_request(data, admin_user)
        assert ar.id is not None
        assert ar.request_number.startswith("AR-")
        assert ar.status == "PENDING"
        assert ar.requester_id == admin_user.id

    async def test_create_access_request_item_not_found(
        self, db: AsyncSession, admin_user: User, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=uuid4(),
            requester_site_id=site.id,
            purpose="Need the item for something important",
        )
        with pytest.raises(HTTPException) as exc_info:
            await service.create_access_request(data, admin_user)
        assert exc_info.value.status_code == 404

    async def test_request_number_sequential(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        base_data = dict(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            purpose="Sequential test for request number generation",
        )
        ar1 = await service.create_access_request(AccessRequestCreate(**base_data), admin_user)
        ar2 = await service.create_access_request(AccessRequestCreate(**base_data), admin_user)
        # Numbers should be sequential
        num1 = int(ar1.request_number.split("-")[-1])
        num2 = int(ar2.request_number.split("-")[-1])
        assert num2 == num1 + 1


@pytest.mark.asyncio
class TestAccessRequestApprove:
    """Tests for AccessRequestService.approve_request."""

    async def _create_pending(self, service, db, admin_user, stored_item_document, site):
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            request_type="LOAN",
            purpose="Approve test for access request workflow",
        )
        return await service.create_access_request(data, admin_user)

    async def test_approve_request(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        ar = await self._create_pending(service, db, admin_user, stored_item_document, site)

        approval = AccessRequestApprove(approved_duration_days=7, review_notes="Approved")
        result = await service.approve_request(ar.id, approval, admin_user)
        assert result.status == "APPROVED"
        assert result.approved_duration_days == 7
        assert result.expected_return_date is not None
        assert result.reviewed_by == admin_user.id

    async def test_approve_non_pending_fails(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        ar = await self._create_pending(service, db, admin_user, stored_item_document, site)

        # Approve first
        approval = AccessRequestApprove(approved_duration_days=7)
        await service.approve_request(ar.id, approval, admin_user)

        # Attempt to approve again
        with pytest.raises(HTTPException) as exc_info:
            await service.approve_request(ar.id, approval, admin_user)
        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
class TestAccessRequestReject:
    """Tests for AccessRequestService.reject_request."""

    async def test_reject_request(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            purpose="Reject test for access request workflow",
        )
        ar = await service.create_access_request(data, admin_user)

        rejection = AccessRequestReject(review_notes="Not sufficient justification for access")
        result = await service.reject_request(ar.id, rejection, admin_user)
        assert result.status == "REJECTED"
        assert result.review_notes == "Not sufficient justification for access"


@pytest.mark.asyncio
class TestAccessRequestFulfill:
    """Tests for AccessRequestService.fulfill_request."""

    async def test_fulfill_request(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            request_type="LOAN",
            purpose="Fulfill test for access request workflow",
        )
        ar = await service.create_access_request(data, admin_user)

        # Approve
        approval = AccessRequestApprove(approved_duration_days=7)
        ar = await service.approve_request(ar.id, approval, admin_user)

        # Fulfill
        result = await service.fulfill_request(ar.id, admin_user)
        assert result.status == "FULFILLED"
        assert result.actual_access_date is not None

        # Item should be OUT
        await db.refresh(stored_item_document)
        assert stored_item_document.status == "OUT"

    async def test_fulfill_non_approved_fails(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            purpose="Fulfill pending test should fail with error",
        )
        ar = await service.create_access_request(data, admin_user)

        with pytest.raises(HTTPException) as exc_info:
            await service.fulfill_request(ar.id, admin_user)
        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
class TestAccessRequestReturn:
    """Tests for AccessRequestService.return_item."""

    async def test_return_item(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)

        # Create -> Approve -> Fulfill -> Return
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            request_type="LOAN",
            purpose="Return test for access request workflow",
        )
        ar = await service.create_access_request(data, admin_user)
        await service.approve_request(
            ar.id, AccessRequestApprove(approved_duration_days=7), admin_user
        )
        await service.fulfill_request(ar.id, admin_user)

        return_data = AccessRequestReturn(actual_return_date=datetime.utcnow())
        result = await service.return_item(ar.id, return_data, admin_user)
        assert result.status == "RETURNED"
        assert result.actual_return_date is not None

        # Item should be back IN_STORAGE
        await db.refresh(stored_item_document)
        assert stored_item_document.status == "IN_STORAGE"


@pytest.mark.asyncio
class TestAccessRequestCancel:
    """Tests for AccessRequestService.cancel_request."""

    async def test_cancel_request(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            purpose="Cancel test for access request workflow",
        )
        ar = await service.create_access_request(data, admin_user)

        result = await service.cancel_request(ar.id, admin_user)
        assert result.status == "CANCELLED"

    async def test_cancel_non_pending_fails(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            purpose="Cancel approved test should fail with error",
        )
        ar = await service.create_access_request(data, admin_user)
        await service.approve_request(
            ar.id, AccessRequestApprove(approved_duration_days=7), admin_user
        )

        with pytest.raises(HTTPException) as exc_info:
            await service.cancel_request(ar.id, admin_user)
        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
class TestAccessRequestExtension:
    """Tests for extension workflow."""

    async def _create_fulfilled(self, service, db, admin_user, stored_item_document, site):
        data = AccessRequestCreate(
            stored_item_id=stored_item_document.id,
            requester_site_id=site.id,
            request_type="LOAN",
            purpose="Extension test for access request workflow",
        )
        ar = await service.create_access_request(data, admin_user)
        await service.approve_request(
            ar.id, AccessRequestApprove(approved_duration_days=7), admin_user
        )
        return await service.fulfill_request(ar.id, admin_user)

    async def test_request_extension(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        ar = await self._create_fulfilled(service, db, admin_user, stored_item_document, site)

        ext_data = AccessRequestExtend(extension_days=3, extension_reason="Need more time for the review")
        result = await service.request_extension(ar.id, ext_data, admin_user)
        assert result.extension_requested is True
        assert result.extension_days == 3

    async def test_request_extension_duplicate_fails(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        ar = await self._create_fulfilled(service, db, admin_user, stored_item_document, site)

        ext_data = AccessRequestExtend(extension_days=3, extension_reason="Need more time for the review")
        await service.request_extension(ar.id, ext_data, admin_user)

        with pytest.raises(HTTPException) as exc_info:
            await service.request_extension(ar.id, ext_data, admin_user)
        assert exc_info.value.status_code == 400

    async def test_approve_extension(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, site: Site
    ):
        service = AccessRequestService(db)
        ar = await self._create_fulfilled(service, db, admin_user, stored_item_document, site)
        original_return = ar.expected_return_date

        ext_data = AccessRequestExtend(extension_days=5, extension_reason="Need more time for the review")
        await service.request_extension(ar.id, ext_data, admin_user)

        result = await service.approve_extension(ar.id, admin_user)
        assert result.extension_approved is True
        # Return date should be extended by 5 days
        assert result.expected_return_date > original_return
