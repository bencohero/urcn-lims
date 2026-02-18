"""Audit trail query routes."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.audit import AuditTrailResponse, IntegrityVerificationResult
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import require_permission, require_role

from ..services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_audit_records(
    user_id: Optional[UUID] = Query(None),
    event_type: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    record_id: Optional[UUID] = Query(None),
    from_timestamp: Optional[datetime] = Query(None),
    to_timestamp: Optional[datetime] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """Query audit trail records with filters."""
    service = AuditService(db)
    records, total = await service.get_audit_records(
        user_id=user_id,
        event_type=event_type,
        table_name=table_name,
        record_id=record_id,
        from_timestamp=from_timestamp,
        to_timestamp=to_timestamp,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse.create(
        items=[AuditTrailResponse.model_validate(r) for r in records],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.get("/record/{table_name}/{record_id}", response_model=APIResponse)
async def get_record_history(
    table_name: str,
    record_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """Get full audit history for a specific record."""
    service = AuditService(db)
    records = await service.get_record_history(table_name, record_id)
    return APIResponse(
        success=True,
        data=[AuditTrailResponse.model_validate(r) for r in records],
    )


@router.get("/verify-integrity", response_model=APIResponse[IntegrityVerificationResult])
async def verify_integrity(
    limit: int = Query(1000, ge=100, le=10000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Verify audit trail hash chain integrity (admin only)."""
    service = AuditService(db)
    result = await service.verify_integrity(limit=limit)
    return APIResponse(
        success=True,
        data=IntegrityVerificationResult.model_validate(result),
    )
