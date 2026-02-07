"""Global search routes."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database import get_db
from common.models import User
from common.schemas.response import APIResponse
from common.auth.dependencies import get_current_user

from ..services.search_service import SearchService

router = APIRouter()


@router.get("/", response_model=APIResponse)
async def global_search(
    q: str = Query(..., min_length=2, description="Search query"),
    types: Optional[str] = Query(None, description="Comma-separated types: document,equipment,consumable"),
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Global search across documents, equipment, and consumables.
    """
    # Parse types
    search_types = None
    if types:
        search_types = [t.strip().lower() for t in types.split(",")]

    service = SearchService(db)
    results = await service.search(
        query=q,
        types=search_types,
        study_id=study_id,
        site_id=site_id,
        user=current_user,
    )

    return APIResponse(
        success=True,
        data=results,
    )
