"""Documents routes."""

from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
from common.schemas.response import APIResponse, PaginatedResponse
from common.auth.dependencies import get_current_user, require_permission

from ..services.document_service import DocumentService

router = APIRouter()


@router.get("/", response_model=PaginatedResponse)
async def get_documents(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    document_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    subject_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get list of documents with pagination and filters."""
    service = DocumentService(db)
    documents, total = await service.get_documents(
        study_id=study_id,
        site_id=site_id,
        document_type=document_type,
        status=status,
        subject_id=subject_id,
        search=search,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size,
        user=current_user,
    )
    return PaginatedResponse.create(
        items=[DocumentResponse.model_validate(d) for d in documents],
        page=page,
        page_size=page_size,
        total_items=total,
    )


@router.post("/", response_model=APIResponse[DocumentResponse], status_code=status.HTTP_201_CREATED)
async def create_document(
    document_data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents", "create")),
):
    """Register a new document."""
    service = DocumentService(db)
    document = await service.create_document(document_data, current_user)
    return APIResponse(
        success=True,
        data=DocumentResponse.model_validate(document),
        message="Document registered successfully",
    )


@router.get("/{document_id}", response_model=APIResponse[DocumentResponse])
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document by ID."""
    service = DocumentService(db)
    document = await service.get_document_by_id(document_id, current_user)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return APIResponse(
        success=True,
        data=DocumentResponse.model_validate(document),
    )


@router.put("/{document_id}", response_model=APIResponse[DocumentResponse])
async def update_document(
    document_id: UUID,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents", "update")),
):
    """Update document."""
    service = DocumentService(db)
    document = await service.update_document(document_id, document_data, current_user)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return APIResponse(
        success=True,
        data=DocumentResponse.model_validate(document),
        message="Document updated successfully",
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("documents", "delete")),
):
    """Soft delete document (archive)."""
    service = DocumentService(db)
    success = await service.delete_document(document_id, current_user)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return None
