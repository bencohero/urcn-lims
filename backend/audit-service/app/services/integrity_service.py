"""Audit trail integrity verification service."""

import hashlib
from datetime import datetime
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


from common.models import AuditTrail
from common.utils.logger import get_logger

logger = get_logger(__name__)


class IntegrityService:
    """Service for verifying audit trail integrity."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def verify_integrity(
        self,
        from_id: Optional[UUID] = None,
        to_id: Optional[UUID] = None,
        limit: int = 1000,
    ) -> Dict[str, Any]:
        """
        Verify audit trail hash chain integrity.

        The audit trail uses blockchain-like hash chaining where each entry's
        hash includes the previous entry's hash. This ensures tamper-evidence.

        Args:
            from_id: Optional starting entry ID
            to_id: Optional ending entry ID
            limit: Maximum number of entries to verify

        Returns:
            Verification result with details
        """
        # Build query
        query = select(AuditTrail).order_by(AuditTrail.timestamp.asc()).limit(limit)

        if from_id:
            query = query.where(AuditTrail.id >= from_id)
        if to_id:
            query = query.where(AuditTrail.id <= to_id)

        result = await self.db.execute(query)
        entries = result.scalars().all()

        if not entries:
            return {
                "total_records_checked": 0,
                "integrity_valid": True,
                "broken_chain_detected": False,
                "details": {
                    "message": "No entries to verify",
                },
            }

        # Verify hash chain
        broken_chain = False
        first_broken_id = None
        previous_hash = None
        verified_count = 0

        for entry in entries:
            # Recalculate expected hash
            expected_hash = self._calculate_hash(entry, previous_hash)

            # Compare with stored hash
            if entry.hash_current != expected_hash:
                broken_chain = True
                first_broken_id = str(entry.id)
                logger.warning(
                    "Hash chain broken",
                    entry_id=str(entry.id),
                    expected=expected_hash,
                    stored=entry.hash_current,
                )
                break

            # Verify previous hash matches
            if previous_hash and entry.hash_previous != previous_hash:
                broken_chain = True
                first_broken_id = str(entry.id)
                logger.warning(
                    "Previous hash mismatch",
                    entry_id=str(entry.id),
                    expected_previous=previous_hash,
                    stored_previous=entry.hash_previous,
                )
                break

            previous_hash = entry.hash_current
            verified_count += 1

        verification_result = {
            "total_records_checked": len(entries),
            "verified_count": verified_count,
            "integrity_valid": not broken_chain,
            "broken_chain_detected": broken_chain,
            "details": {
                "first_record_id": str(entries[0].id) if entries else None,
                "last_record_id": str(entries[-1].id) if entries else None,
                "verification_timestamp": datetime.utcnow().isoformat(),
            },
        }

        if broken_chain:
            verification_result["details"]["broken_at_id"] = first_broken_id
            verification_result["details"]["message"] = (
                "Hash chain integrity compromised. Data may have been tampered."
            )
        else:
            verification_result["details"]["message"] = (
                "All records verified. Hash chain is intact."
            )

        logger.info(
            "Integrity verification completed",
            records_checked=len(entries),
            valid=not broken_chain,
        )

        return verification_result

    def _calculate_hash(
        self, entry: AuditTrail, previous_hash: Optional[str]
    ) -> str:
        """
        Calculate the expected hash for an audit entry.

        The hash is computed from:
        - Event type
        - Table name
        - Record ID
        - User ID
        - Action
        - Old values (JSON)
        - New values (JSON)
        - Timestamp
        - Previous hash
        """
        import json

        # Serialize values to JSON for consistent hashing
        old_values_str = json.dumps(entry.old_values, sort_keys=True) if entry.old_values else ""
        new_values_str = json.dumps(entry.new_values, sort_keys=True) if entry.new_values else ""

        # Build hash input
        hash_input = "".join([
            entry.event_type or "",
            entry.table_name or "",
            str(entry.record_id) if entry.record_id else "",
            str(entry.user_id) if entry.user_id else "",
            entry.action or "",
            old_values_str,
            new_values_str,
            entry.timestamp.isoformat() if entry.timestamp else "",
            previous_hash or "",
        ])

        # Calculate SHA-256 hash
        return hashlib.sha256(hash_input.encode()).hexdigest()

    async def get_latest_hash(self) -> Optional[str]:
        """Get the hash of the most recent audit entry."""
        query = select(AuditTrail.hash_current).order_by(AuditTrail.timestamp.desc()).limit(1)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def verify_single_entry(self, entry_id: UUID) -> Dict[str, Any]:
        """Verify a single audit entry and its link to the previous entry."""
        # Get the entry
        query = select(AuditTrail).where(AuditTrail.id == entry_id)
        result = await self.db.execute(query)
        entry = result.scalar_one_or_none()

        if not entry:
            return {
                "valid": False,
                "error": "Entry not found",
            }

        # Get previous entry
        prev_query = (
            select(AuditTrail)
            .where(AuditTrail.timestamp < entry.timestamp)
            .order_by(AuditTrail.timestamp.desc())
            .limit(1)
        )
        prev_result = await self.db.execute(prev_query)
        prev_entry = prev_result.scalar_one_or_none()

        previous_hash = prev_entry.hash_current if prev_entry else None

        # Verify hash
        expected_hash = self._calculate_hash(entry, previous_hash)
        hash_valid = entry.hash_current == expected_hash

        # Verify previous hash link
        prev_hash_valid = entry.hash_previous == previous_hash

        return {
            "entry_id": str(entry_id),
            "valid": hash_valid and prev_hash_valid,
            "hash_valid": hash_valid,
            "previous_hash_valid": prev_hash_valid,
            "expected_hash": expected_hash,
            "stored_hash": entry.hash_current,
        }
