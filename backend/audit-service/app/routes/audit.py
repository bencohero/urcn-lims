"""Audit trail routes."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from common.database import get_db
from common.models import User
from common.schemas.response import APIResponse, PaginatedResponse
from common.schemas.audit import AuditTrailResponse, IntegrityVerificationResult
from common.auth.dependencies import get_current_user, require_permission

from ..services.audit_service import AuditQueryService
from ..services.integrity_service import IntegrityService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def get_audit_trail(
    user_id: Optional[UUID] = Query(None),
    event_type: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    record_id: Optional[UUID] = Query(None),
    from_timestamp: Optional[str] = Query(None),
    to_timestamp: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """Query audit trail with filters and pagination."""
    service = AuditQueryService(db)
    entries, total = await service.query_audit_trail(
        user_id=user_id,
        event_type=event_type,
        table_name=table_name,
        record_id=record_id,
        from_timestamp=from_timestamp,
        to_timestamp=to_timestamp,
        search=search,
        page=page,
        page_size=page_size,
    )
    return PaginatedResponse.create(
        items=[AuditTrailResponse.model_validate(e) for e in entries],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.get("/statistics", response_model=APIResponse)
async def get_audit_statistics(
    from_timestamp: Optional[str] = Query(None),
    to_timestamp: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """Get audit trail statistics."""
    service = AuditQueryService(db)
    stats = await service.get_statistics(
        from_timestamp=from_timestamp,
        to_timestamp=to_timestamp,
    )
    return APIResponse(success=True, data=stats)


@router.get("/verify-integrity", response_model=APIResponse)
async def verify_integrity(
    from_id: Optional[UUID] = Query(None),
    to_id: Optional[UUID] = Query(None),
    limit: int = Query(1000, ge=100, le=10000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "verify")),
):
    """Verify audit trail integrity (hash chain validation)."""
    service = IntegrityService(db)
    result = await service.verify_integrity(from_id=from_id, to_id=to_id, limit=limit)
    return APIResponse(
        success=True,
        data=result,
        message=(
            "Intégrité vérifiée avec succès"
            if result["integrity_valid"]
            else "Anomalie détectée dans la chaîne d'intégrité"
        ),
    )


@router.get("/record/{table_name}/{record_id}", response_model=APIResponse)
async def get_record_history(
    table_name: str,
    record_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """Get complete audit history for a specific record."""
    service = AuditQueryService(db)
    entries = await service.get_record_history(table_name, record_id)
    return APIResponse(
        success=True,
        data={
            "table_name": table_name,
            "record_id": str(record_id),
            "history": [AuditTrailResponse.model_validate(e) for e in entries],
            "total_entries": len(entries),
        },
    )


@router.get("/{entry_id}", response_model=APIResponse)
async def get_audit_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("audit", "read")),
):
    """Get a single audit trail entry by ID."""
    service = AuditQueryService(db)
    entry = await service.get_by_id(entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return APIResponse(success=True, data=AuditTrailResponse.model_validate(entry))
