"""Audit trail service."""

import hashlib
import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession


from common.models import AuditTrail, User


class AuditService:
    """Service for audit trail logging."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_action(
        self,
        event_type: str,
        table_name: str,
        record_id: UUID,
        user_id: UUID,
        action: str = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        site_id: Optional[UUID] = None,
        reason: Optional[str] = None,
    ) -> AuditTrail:
        """
        Log an action to the audit trail.

        Args:
            event_type: Type of event (CREATE, UPDATE, DELETE, etc.)
            table_name: Name of the affected table
            record_id: ID of the affected record
            user_id: ID of the user performing the action
            action: Human-readable action description
            old_values: Previous values (for updates)
            new_values: New values
            ip_address: Client IP address
            site_id: Associated site ID
            reason: Reason for the action

        Returns:
            Created AuditTrail record
        """
        # Get user info for denormalization
        user = await self.db.get(User, user_id)
        username = user.username if user else None
        user_full_name = user.full_name if user else None

        # Get previous hash for chain
        previous_hash = await self._get_previous_hash()

        # Build action description if not provided
        if action is None:
            action = f"{event_type} {table_name}"

        # Create audit record
        audit_record = AuditTrail(
            event_type=event_type,
            table_name=table_name,
            record_id=record_id,
            user_id=user_id,
            username=username,
            user_full_name=user_full_name,
            action=action,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            site_id=site_id,
            reason=reason,
            timestamp=datetime.utcnow(),
            hash_previous=previous_hash,
            hash_current="",  # Will be set below
        )

        # Calculate hash for this record
        audit_record.hash_current = self._calculate_hash(audit_record, previous_hash)

        self.db.add(audit_record)
        await self.db.flush()

        return audit_record

    async def _get_previous_hash(self) -> Optional[str]:
        """Get the hash of the most recent audit record."""
        result = await self.db.execute(
            select(AuditTrail.hash_current)
            .order_by(AuditTrail.timestamp.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return row if row else None

    def _calculate_hash(
        self, record: AuditTrail, previous_hash: Optional[str]
    ) -> str:
        """Calculate SHA-256 hash for audit record."""
        data = {
            "event_type": record.event_type,
            "table_name": record.table_name,
            "record_id": str(record.record_id) if record.record_id else None,
            "user_id": str(record.user_id) if record.user_id else None,
            "action": record.action,
            "old_values": record.old_values,
            "new_values": record.new_values,
            "timestamp": record.timestamp.isoformat(),
            "previous_hash": previous_hash,
        }
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    # ──────────────────────────────────────────────
    # Query methods
    # ──────────────────────────────────────────────

    async def get_audit_records(
        self,
        user_id: Optional[UUID] = None,
        event_type: Optional[str] = None,
        table_name: Optional[str] = None,
        record_id: Optional[UUID] = None,
        from_timestamp: Optional[datetime] = None,
        to_timestamp: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> Tuple[List[AuditTrail], int]:
        """Query audit trail records with filters and pagination."""
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
            filters.append(AuditTrail.timestamp >= from_timestamp)
        if to_timestamp:
            filters.append(AuditTrail.timestamp <= to_timestamp)

        if filters:
            query = query.where(and_(*filters))

        # Count
        count_query = select(func.count()).select_from(AuditTrail)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(
            AuditTrail.timestamp.desc()
        )

        result = await self.db.execute(query)
        records = result.scalars().all()

        return records, total

    async def get_record_history(
        self, table_name: str, record_id: UUID
    ) -> List[AuditTrail]:
        """Get full audit history for a specific record."""
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
        return result.scalars().all()

    async def verify_integrity(
        self, limit: int = 1000
    ) -> Dict[str, Any]:
        """
        Verify the integrity of the audit trail hash chain.

        Checks that each record's hash_previous matches the preceding
        record's hash_current, ensuring no tampering has occurred.
        """
        query = (
            select(AuditTrail)
            .order_by(AuditTrail.timestamp.asc())
            .limit(limit)
        )
        result = await self.db.execute(query)
        records = result.scalars().all()

        total_checked = len(records)
        broken_at = []
        previous_hash = None

        for record in records:
            # Check chain continuity
            if record.hash_previous != previous_hash:
                broken_at.append({
                    "record_id": str(record.id),
                    "timestamp": record.timestamp.isoformat(),
                    "expected_previous": previous_hash,
                    "actual_previous": record.hash_previous,
                })

            # Verify self-hash
            computed_hash = self._calculate_hash(record, record.hash_previous)
            if computed_hash != record.hash_current:
                broken_at.append({
                    "record_id": str(record.id),
                    "timestamp": record.timestamp.isoformat(),
                    "issue": "hash_current mismatch",
                    "expected": computed_hash,
                    "actual": record.hash_current,
                })

            previous_hash = record.hash_current

        return {
            "total_records_checked": total_checked,
            "integrity_valid": len(broken_at) == 0,
            "broken_chain_detected": len(broken_at) > 0,
            "details": {
                "breaks": broken_at,
                "checked_range": {
                    "from": records[0].timestamp.isoformat() if records else None,
                    "to": records[-1].timestamp.isoformat() if records else None,
                },
            },
        }
