"""Access request workflow routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.access_request import (
    AccessRequestApprove,
    AccessRequestCreate,
    AccessRequestExtend,
    AccessRequestReject,
    AccessRequestResponse,
    AccessRequestReturn,
)
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.workflow_service import WorkflowService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_access_requests(
    status: Optional[str] = Query(None),
    requester_id: Optional[UUID] = Query(None),
    stored_item_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    urgency: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List access requests with filters."""
    service = WorkflowService(db)
    requests, total = await service.get_access_requests(
        status_filter=status,
        requester_id=requester_id,
        stored_item_id=stored_item_id,
        site_id=site_id,
        urgency=urgency,
        search=search,
        from_date=from_date,
        page=page,
        page_size=page_size,
        user=current_user,
    )

    return PaginatedResponse(
        success=True,
        data={
            "items": [AccessRequestResponse.model_validate(r) for r in requests],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total,
                "total_pages": (total + page_size - 1) // page_size,
            },
        },
    )


@router.post("", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def create_access_request(
    request_data: AccessRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new access request."""
    service = WorkflowService(db)
    access_request = await service.create_access_request(request_data, current_user)
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Access request created successfully",
    )


@router.get("/{request_id}", response_model=APIResponse)
async def get_access_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get access request details."""
    service = WorkflowService(db)
    access_request = await service.get_access_request_by_id(request_id, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(success=True, data=AccessRequestResponse.model_validate(access_request))


@router.post("/{request_id}/approve", response_model=APIResponse)
async def approve_access_request(
    request_id: UUID,
    approve_data: AccessRequestApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("access_requests", "approve")),
):
    """Approve an access request."""
    service = WorkflowService(db)
    access_request = await service.approve_request(request_id, approve_data, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Access request approved",
    )


@router.post("/{request_id}/reject", response_model=APIResponse)
async def reject_access_request(
    request_id: UUID,
    reject_data: AccessRequestReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("access_requests", "approve")),
):
    """Reject an access request."""
    service = WorkflowService(db)
    access_request = await service.reject_request(request_id, reject_data, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Access request rejected",
    )


@router.post("/{request_id}/fulfill", response_model=APIResponse)
async def fulfill_access_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("access_requests", "fulfill")),
):
    """Mark an approved request as fulfilled (item handed over)."""
    service = WorkflowService(db)
    access_request = await service.fulfill_request(request_id, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Access request fulfilled. Item marked as OUT.",
    )


@router.post("/{request_id}/return", response_model=APIResponse)
async def return_item(
    request_id: UUID,
    return_data: AccessRequestReturn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("access_requests", "fulfill")),
):
    """Record item return for a fulfilled request."""
    service = WorkflowService(db)
    access_request = await service.return_item(request_id, return_data, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Item returned successfully",
    )


@router.post("/{request_id}/extend", response_model=APIResponse)
async def request_extension(
    request_id: UUID,
    extension_data: AccessRequestExtend,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Request an extension for a fulfilled access request."""
    service = WorkflowService(db)
    access_request = await service.request_extension(request_id, extension_data, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Extension requested",
    )


@router.post("/{request_id}/approve-extension", response_model=APIResponse)
async def approve_extension(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("access_requests", "approve")),
):
    """Approve an extension request."""
    service = WorkflowService(db)
    access_request = await service.approve_extension(request_id, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Extension approved",
    )


@router.post("/{request_id}/cancel", response_model=APIResponse)
async def cancel_access_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a pending or approved access request."""
    service = WorkflowService(db)
    access_request = await service.cancel_request(request_id, current_user)
    if not access_request:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")
    return APIResponse(
        success=True,
        data=AccessRequestResponse.model_validate(access_request),
        message="Access request cancelled",
    )
