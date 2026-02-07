"""RFID routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.response import APIResponse
from common.schemas.rfid import (
    RFIDTagCreate,
    RFIDTagResponse,
    RFIDReadRequest,
    RFIDReadResponse,
    RFIDBulkReadRequest,
    RFIDBulkReadResponse,
)
from common.auth.dependencies import get_current_user, require_permission

from ..services.rfid_service import RFIDService

router = APIRouter()


@router.post("/tags", response_model=APIResponse, status_code=status.HTTP_201_CREATED)
async def encode_tag(
    tag_data: RFIDTagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("rfid", "create")),
):
    """
    Encode a new RFID tag and associate it with an item.
    """
    service = RFIDService(db)
    tag = await service.encode_tag(tag_data, current_user)

    return APIResponse(
        success=True,
        data=RFIDTagResponse.model_validate(tag),
        message="RFID tag encoded successfully",
    )


@router.post("/read", response_model=APIResponse)
async def read_tag(
    read_request: RFIDReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("rfid", "read")),
):
    """
    Read an RFID tag and return associated item information.
    """
    service = RFIDService(db)
    result = await service.read_tag(read_request.epc, read_request.reader_id, current_user)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFID tag not found",
        )

    return APIResponse(
        success=True,
        data=result,
    )


@router.get("/tags/{tag_id}", response_model=APIResponse)
async def get_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("rfid", "read")),
):
    """
    Get RFID tag details by ID.
    """
    service = RFIDService(db)
    tag = await service.get_tag_by_id(tag_id)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFID tag not found",
        )

    return APIResponse(
        success=True,
        data=RFIDTagResponse.model_validate(tag),
    )


@router.get("/tags/epc/{epc}", response_model=APIResponse)
async def get_tag_by_epc(
    epc: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("rfid", "read")),
):
    """
    Get RFID tag details by EPC.
    """
    service = RFIDService(db)
    tag = await service.get_tag_by_epc(epc)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFID tag not found",
        )

    return APIResponse(
        success=True,
        data=RFIDTagResponse.model_validate(tag),
    )


@router.post("/bulk-read", response_model=APIResponse)
async def bulk_read_tags(
    bulk_request: RFIDBulkReadRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("rfid", "read")),
):
    """
    Bulk read multiple RFID tags (inventory operation).
    """
    service = RFIDService(db)
    result = await service.bulk_read(
        epcs=bulk_request.epcs,
        reader_id=bulk_request.reader_id,
        location_id=bulk_request.location_id,
        user=current_user,
    )

    return APIResponse(
        success=True,
        data=result,
    )


@router.put("/tags/{tag_id}/deactivate", response_model=APIResponse)
async def deactivate_tag(
    tag_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("rfid", "update")),
):
    """
    Deactivate an RFID tag.
    """
    service = RFIDService(db)
    tag = await service.deactivate_tag(tag_id, current_user)

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RFID tag not found",
        )

    return APIResponse(
        success=True,
        data=RFIDTagResponse.model_validate(tag),
        message="RFID tag deactivated successfully",
    )
