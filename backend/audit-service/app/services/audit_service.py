"""Audit trail query service."""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import AuditTrail
from common.utils.logger import get_logger

logger = get_logger(__name__)


class AuditQueryService:
    """Service for querying audit trail."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def query_audit_trail(
        self,
        user_id: Optional[UUID] = None,
        event_type: Optional[str] = None,
        table_name: Optional[str] = None,
        record_id: Optional[UUID] = None,
        from_timestamp: Optional[str] = None,
        to_timestamp: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> Tuple[List[AuditTrail], int]:
        """
        Query audit trail with filters.

        Returns:
            Tuple of (entries, total_count)
        """
        query = select(AuditTrail)

        filters = []
        if user_id:
            filters.append(AuditTrail.user_id == user_id)
        if event_type:
            filters.append(AuditTrail.event_type == event_type)
        if table_name:
            filters.append(AuditTrail.table_name == table_name)
        if record_id:
            filters.append(AuditTrail.record_id == record_id)
        if from_timestamp:
            filters.append(AuditTrail.timestamp >= datetime.fromisoformat(from_timestamp))
        if to_timestamp:
            filters.append(AuditTrail.timestamp <= datetime.fromisoformat(to_timestamp))

        if filters:
            query = query.where(and_(*filters))

        # Total count
        count_query = select(func.count()).select_from(AuditTrail)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(AuditTrail.timestamp.desc())

        result = await self.db.execute(query)
        entries = result.scalars().all()

        logger.info(
            "Audit trail queried",
            filters=len(filters),
            results=len(entries),
            total=total,
        )

        return entries, total

    async def get_record_history(
        self, table_name: str, record_id: UUID
    ) -> List[AuditTrail]:
        """Get complete audit history for a specific record."""
        query = (
            select(AuditTrail)
            .where(
                and_(
                    AuditTrail.table_name == table_name,
                    AuditTrail.record_id == record_id,
                )
            )
            .order_by(AuditTrail.timestamp.asc())
        )

        result = await self.db.execute(query)
        entries = result.scalars().all()

        return entries

    async def get_statistics(
        self,
        from_timestamp: Optional[str] = None,
        to_timestamp: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get audit trail statistics."""
        filters = []
        if from_timestamp:
            filters.append(AuditTrail.timestamp >= datetime.fromisoformat(from_timestamp))
        if to_timestamp:
            filters.append(AuditTrail.timestamp <= datetime.fromisoformat(to_timestamp))

        # Events by type
        type_query = select(
            AuditTrail.event_type,
            func.count(AuditTrail.id).label("count")
        ).group_by(AuditTrail.event_type)

        if filters:
            type_query = type_query.where(and_(*filters))

        type_result = await self.db.execute(type_query)
        by_type = dict(type_result.all())

        # Events by table
        table_query = select(
            AuditTrail.table_name,
            func.count(AuditTrail.id).label("count")
        ).group_by(AuditTrail.table_name)

        if filters:
            table_query = table_query.where(and_(*filters))

        table_result = await self.db.execute(table_query)
        by_table = dict(table_result.all())

        # Total count
        total_query = select(func.count()).select_from(AuditTrail)
        if filters:
            total_query = total_query.where(and_(*filters))
        total_result = await self.db.execute(total_query)
        total = total_result.scalar()

        # Most active users
        user_query = (
            select(
                AuditTrail.username,
                func.count(AuditTrail.id).label("count")
            )
            .group_by(AuditTrail.username)
            .order_by(func.count(AuditTrail.id).desc())
            .limit(10)
        )

        if filters:
            user_query = user_query.where(and_(*filters))

        user_result = await self.db.execute(user_query)
        top_users = [{"username": u, "actions": c} for u, c in user_result.all()]

        return {
            "total_entries": total,
            "by_event_type": by_type,
            "by_table": by_table,
            "top_users": top_users,
        }
