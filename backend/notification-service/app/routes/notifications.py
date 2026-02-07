"""Notification routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.response import APIResponse, PaginatedResponse
from common.schemas.notification import NotificationResponse
from common.auth.dependencies import get_current_user

from ..services.notification_service import NotificationService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def list_notifications(
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List notifications for current user.
    """
    service = NotificationService(db)
    notifications, total, unread_count = await service.get_user_notifications(
        user_id=current_user.id,
        is_read=is_read,
        notification_type=notification_type,
        from_date=from_date,
        page=page,
        page_size=page_size,
    )

    return PaginatedResponse(
        success=True,
        data={
            "items": [NotificationResponse.model_validate(n) for n in notifications],
            "unread_count": unread_count,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_items": total,
                "total_pages": (total + page_size - 1) // page_size,
            },
        },
    )


@router.get("/{notification_id}", response_model=APIResponse)
async def get_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notification details.
    """
    service = NotificationService(db)
    notification = await service.get_notification_by_id(notification_id, current_user.id)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return APIResponse(
        success=True,
        data=NotificationResponse.model_validate(notification),
    )


@router.put("/{notification_id}/read", response_model=APIResponse)
async def mark_as_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark notification as read.
    """
    service = NotificationService(db)
    notification = await service.mark_as_read(notification_id, current_user.id)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return APIResponse(
        success=True,
        data=NotificationResponse.model_validate(notification),
    )


@router.put("/mark-all-read", response_model=APIResponse)
async def mark_all_as_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications as read for current user.
    """
    service = NotificationService(db)
    count = await service.mark_all_as_read(current_user.id)

    return APIResponse(
        success=True,
        message="All notifications marked as read",
        data={"marked_count": count},
    )


@router.get("/unread/count", response_model=APIResponse)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get count of unread notifications.
    """
    service = NotificationService(db)
    count = await service.get_unread_count(current_user.id)

    return APIResponse(
        success=True,
        data={"unread_count": count},
    )
