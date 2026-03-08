"""Report generation service."""

import io
from datetime import date, datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import (
    StoredItem, Document, Equipment, Consumable,
    Movement, AccessRequest, AuditTrail, User
)
from common.auth.permissions import PermissionChecker
from common.utils.logger import get_logger

from .pdf_generator import PDFGenerator
from .excel_generator import ExcelGenerator

logger = get_logger(__name__)


class ReportService:
    """Service for report generation."""

    MEDIA_TYPES = {
        "pdf": "application/pdf",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv",
    }

    def __init__(self, db: AsyncSession):
        self.db = db
        self.pdf_generator = PDFGenerator()
        self.excel_generator = ExcelGenerator()

    async def generate_inventory_report(
        self,
        study_id: Optional[UUID],
        site_id: Optional[UUID],
        format: str,
        group_by: Optional[str],
        user: User,
    ) -> Tuple[io.BytesIO, str, str]:
        """Generate inventory report."""
        # Get inventory data
        query = select(StoredItem).where(
            StoredItem.status.in_(["IN_STORAGE", "IN_USE"])
        )

        filters = []
        if study_id:
            filters.append(StoredItem.study_id == study_id)
        if site_id:
            filters.append(StoredItem.site_id == site_id)

        if not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(StoredItem.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        result = await self.db.execute(query)
        items = result.scalars().all()

        # Generate report
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"inventory_report_{timestamp}"

        if format == "pdf":
            content = self.pdf_generator.generate_inventory_report(items, group_by)
            filename += ".pdf"
        elif format == "excel":
            content = self.excel_generator.generate_inventory_report(items, group_by)
            filename += ".xlsx"
        else:
            content = self._generate_csv(items, ["id", "item_type", "description", "status"])
            filename += ".csv"

        logger.info(
            "Inventory report generated",
            format=format,
            items_count=len(items),
            user_id=str(user.id),
        )

        return content, filename, self.MEDIA_TYPES[format]

    async def generate_movements_report(
        self,
        study_id: Optional[UUID],
        site_id: Optional[UUID],
        from_date: Optional[str],
        to_date: Optional[str],
        format: str,
        user: User,
    ) -> Tuple[io.BytesIO, str, str]:
        """Generate movements report."""
        query = select(Movement)

        filters = []
        if from_date:
            filters.append(Movement.movement_date >= datetime.fromisoformat(from_date))
        if to_date:
            filters.append(Movement.movement_date <= datetime.fromisoformat(to_date))

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(Movement.movement_date.desc())
        result = await self.db.execute(query)
        movements = result.scalars().all()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"movements_report_{timestamp}"

        if format == "pdf":
            content = self.pdf_generator.generate_movements_report(movements)
            filename += ".pdf"
        elif format == "excel":
            content = self.excel_generator.generate_movements_report(movements)
            filename += ".xlsx"
        else:
            content = self._generate_csv(movements, ["id", "movement_type", "movement_date"])
            filename += ".csv"

        logger.info(
            "Movements report generated",
            format=format,
            movements_count=len(movements),
            user_id=str(user.id),
        )

        return content, filename, self.MEDIA_TYPES[format]

    async def generate_access_requests_report(
        self,
        status: Optional[str],
        from_date: Optional[str],
        to_date: Optional[str],
        format: str,
        user: User,
    ) -> Tuple[io.BytesIO, str, str]:
        """Generate access requests report."""
        query = select(AccessRequest)

        filters = []
        if status:
            filters.append(AccessRequest.status == status)
        if from_date:
            filters.append(AccessRequest.requested_at >= datetime.fromisoformat(from_date))
        if to_date:
            filters.append(AccessRequest.requested_at <= datetime.fromisoformat(to_date))

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(AccessRequest.requested_at.desc())
        result = await self.db.execute(query)
        requests = result.scalars().all()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"access_requests_report_{timestamp}"

        if format == "pdf":
            content = self.pdf_generator.generate_access_requests_report(requests)
            filename += ".pdf"
        elif format == "excel":
            content = self.excel_generator.generate_access_requests_report(requests)
            filename += ".xlsx"
        else:
            content = self._generate_csv(requests, ["request_number", "status", "requested_at"])
            filename += ".csv"

        logger.info(
            "Access requests report generated",
            format=format,
            requests_count=len(requests),
            user_id=str(user.id),
        )

        return content, filename, self.MEDIA_TYPES[format]

    async def generate_audit_trail_report(
        self,
        table_name: Optional[str],
        record_id: Optional[UUID],
        from_date: Optional[str],
        to_date: Optional[str],
        format: str,
        user: User,
    ) -> Tuple[io.BytesIO, str, str]:
        """Generate audit trail report."""
        query = select(AuditTrail)

        filters = []
        if table_name:
            filters.append(AuditTrail.table_name == table_name)
        if record_id:
            filters.append(AuditTrail.record_id == record_id)
        if from_date:
            filters.append(AuditTrail.timestamp >= datetime.fromisoformat(from_date))
        if to_date:
            filters.append(AuditTrail.timestamp <= datetime.fromisoformat(to_date))

        if filters:
            query = query.where(and_(*filters))

        query = query.order_by(AuditTrail.timestamp.desc()).limit(1000)
        result = await self.db.execute(query)
        audit_entries = result.scalars().all()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"audit_trail_report_{timestamp}"

        if format == "pdf":
            content = self.pdf_generator.generate_audit_trail_report(audit_entries)
            filename += ".pdf"
        elif format == "excel":
            content = self.excel_generator.generate_audit_trail_report(audit_entries)
            filename += ".xlsx"
        else:
            content = self._generate_csv(audit_entries, ["event_type", "table_name", "timestamp"])
            filename += ".csv"

        logger.info(
            "Audit trail report generated",
            format=format,
            entries_count=len(audit_entries),
            user_id=str(user.id),
        )

        return content, filename, self.MEDIA_TYPES[format]

    async def get_statistics(
        self,
        study_id: Optional[UUID],
        site_id: Optional[UUID],
        period: str,
        user: User,
    ) -> Dict[str, Any]:
        """Get dashboard statistics."""
        # Calculate period
        now = datetime.now()
        if period == "day":
            start_date = now - timedelta(days=1)
        elif period == "week":
            start_date = now - timedelta(weeks=1)
        elif period == "month":
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=365)

        # Build base filter
        base_filters = []
        if study_id:
            base_filters.append(StoredItem.study_id == study_id)
        if site_id:
            base_filters.append(StoredItem.site_id == site_id)

        if not user.is_superuser:
            checker = PermissionChecker(user)
            base_filters.append(StoredItem.site_id.in_(checker.site_ids))

        # Inventory stats
        inventory_query = select(
            StoredItem.item_type,
            func.count(StoredItem.id).label("count")
        ).group_by(StoredItem.item_type)

        if base_filters:
            inventory_query = inventory_query.where(and_(*base_filters))

        inventory_result = await self.db.execute(inventory_query)
        inventory_by_type = dict(inventory_result.all())

        total_documents = inventory_by_type.get("DOCUMENT", 0)
        total_equipment = inventory_by_type.get("EQUIPMENT", 0)
        total_consumables = inventory_by_type.get("CONSUMABLE", 0)

        # Access request stats
        ar_query = select(
            AccessRequest.status,
            func.count(AccessRequest.id).label("count")
        ).where(
            AccessRequest.requested_at >= start_date
        ).group_by(AccessRequest.status)

        ar_result = await self.db.execute(ar_query)
        ar_by_status = dict(ar_result.all())

        # Overdue returns
        overdue_query = select(func.count(AccessRequest.id)).where(
            and_(
                AccessRequest.status == "FULFILLED",
                AccessRequest.expected_return_date < date.today(),
                AccessRequest.actual_return_date.is_(None),
            )
        )
        overdue_result = await self.db.execute(overdue_query)
        overdue_count = overdue_result.scalar()

        return {
            "period": {
                "start": start_date.isoformat(),
                "end": now.isoformat(),
            },
            "inventory": {
                "total_documents": total_documents,
                "total_equipment": total_equipment,
                "total_consumables": total_consumables,
                "total_items": total_documents + total_equipment + total_consumables,
            },
            "access_requests": {
                "total": sum(ar_by_status.values()),
                "pending": ar_by_status.get("PENDING", 0),
                "approved": ar_by_status.get("APPROVED", 0),
                "rejected": ar_by_status.get("REJECTED", 0),
                "fulfilled": ar_by_status.get("FULFILLED", 0),
                "overdue": overdue_count,
            },
            "alerts": {
                "overdue_returns": overdue_count,
            },
        }

    def _generate_csv(self, items: List, columns: List[str]) -> io.BytesIO:
        """Generate simple CSV content."""
        import csv

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(columns)

        for item in items:
            row = [getattr(item, col, "") for col in columns]
            writer.writerow(row)

        content = io.BytesIO(output.getvalue().encode("utf-8"))
        content.seek(0)
        return content
