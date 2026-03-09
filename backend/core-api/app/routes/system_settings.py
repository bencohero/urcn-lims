"""System settings routes."""

from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from common.database import get_db
from common.models import SystemSettings, User
from common.schemas.response import APIResponse
from common.auth.dependencies import require_role

router = APIRouter()


class SystemSettingResponse(PydanticBaseModel):
    id: UUID
    category: str
    setting_key: str
    setting_value: Any
    data_type: str
    description: Optional[str]
    is_sensitive: bool
    is_editable: bool

    model_config = {"from_attributes": True}


class SystemSettingUpdate(PydanticBaseModel):
    value: Any


@router.get("", response_model=APIResponse[List[SystemSettingResponse]])
async def get_system_settings(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Get all system settings (admin only)."""
    query = select(SystemSettings).order_by(SystemSettings.category, SystemSettings.setting_key)
    if category:
        query = query.where(SystemSettings.category == category.upper())

    result = await db.execute(query)
    settings = result.scalars().all()

    items = [
        SystemSettingResponse(
            id=s.id,
            category=s.category,
            setting_key=s.setting_key,
            setting_value=None if s.is_sensitive else s.get_value(),
            data_type=s.data_type,
            description=s.description,
            is_sensitive=s.is_sensitive,
            is_editable=s.is_editable,
        )
        for s in settings
    ]
    return APIResponse(success=True, data=items)


@router.put("/{setting_id}", response_model=APIResponse[SystemSettingResponse])
async def update_system_setting(
    setting_id: UUID,
    payload: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    """Update a system setting value (admin only)."""
    query = select(SystemSettings).where(SystemSettings.id == setting_id)
    result = await db.execute(query)
    setting = result.scalar_one_or_none()

    if not setting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Setting not found")

    if not setting.is_editable:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This setting cannot be modified",
        )

    setting.set_value(payload.value)
    setting.updated_by = current_user.id
    await db.commit()
    await db.refresh(setting)

    return APIResponse(
        success=True,
        data=SystemSettingResponse(
            id=setting.id,
            category=setting.category,
            setting_key=setting.setting_key,
            setting_value=None if setting.is_sensitive else setting.get_value(),
            data_type=setting.data_type,
            description=setting.description,
            is_sensitive=setting.is_sensitive,
            is_editable=setting.is_editable,
        ),
        message="Setting updated successfully",
    )
