"""Report routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from common.database import get_db
from common.models import User
from common.schemas.response import APIResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.report_service import ReportService

router = APIRouter()


@router.get("/inventory")
async def generate_inventory_report(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    format: str = Query("pdf", pattern="^(pdf|excel|csv)$"),
    group_by: Optional[str] = Query(None, pattern="^(location|type|status)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "create")),
):
    """
    Generate inventory report.
    """
    service = ReportService(db)
    content, filename, media_type = await service.generate_inventory_report(
        study_id=study_id,
        site_id=site_id,
        format=format,
        group_by=group_by,
        user=current_user,
    )

    return StreamingResponse(
        content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/movements")
async def generate_movements_report(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    format: str = Query("pdf", pattern="^(pdf|excel|csv)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "create")),
):
    """
    Generate movements report.
    """
    service = ReportService(db)
    content, filename, media_type = await service.generate_movements_report(
        study_id=study_id,
        site_id=site_id,
        from_date=from_date,
        to_date=to_date,
        format=format,
        user=current_user,
    )

    return StreamingResponse(
        content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/access-requests")
async def generate_access_requests_report(
    status: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    format: str = Query("pdf", pattern="^(pdf|excel|csv)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("reports", "create")),
):
    """
    Generate access requests report.
    """
    service = ReportService(db)
    content, filename, media_type = await service.generate_access_requests_report(
        status=status,
        from_date=from_date,
        to_date=to_date,
        format=format,
        user=current_user,
    )

    return StreamingResponse(
        content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/audit-trail")
async def generate_audit_trail_report(
    table_name: Optional[str] = Query(None),
    record_id: Optional[UUID] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    format: str = Query("pdf", pattern="^(pdf|excel|csv)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """
    Generate audit trail report.
    """
    service = ReportService(db)
    content, filename, media_type = await service.generate_audit_trail_report(
        table_name=table_name,
        record_id=record_id,
        from_date=from_date,
        to_date=to_date,
        format=format,
        user=current_user,
    )

    return StreamingResponse(
        content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/statistics", response_model=APIResponse)
async def get_statistics(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    period: str = Query("month", pattern="^(day|week|month|year)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get dashboard statistics.
    """
    service = ReportService(db)
    stats = await service.get_statistics(
        study_id=study_id,
        site_id=site_id,
        period=period,
        user=current_user,
    )

    return APIResponse(
        success=True,
        data=stats,
    )
