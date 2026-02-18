"""Global search service."""

from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import Document, Equipment, Consumable, StoredItem, User
from common.auth.permissions import PermissionChecker


class SearchService:
    """Service for global search across entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(
        self,
        query: str,
        types: Optional[List[str]] = None,
        study_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        user: User = None,
    ) -> Dict[str, Any]:
        """
        Search across documents, equipment, and consumables.

        Args:
            query: Search query string
            types: List of types to search (document, equipment, consumable)
            study_id: Filter by study
            site_id: Filter by site
            user: Current user for permission filtering

        Returns:
            Dictionary with results by type and total count
        """
        if types is None:
            types = ["document", "equipment", "consumable"]

        results = {
            "documents": [],
            "equipment": [],
            "consumables": [],
            "total_results": 0,
        }

        search_pattern = f"%{query}%"

        # Get user's allowed sites
        site_ids = None
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            site_ids = checker.site_ids

        if "document" in types:
            docs = await self._search_documents(
                search_pattern, study_id, site_id, site_ids
            )
            results["documents"] = docs
            results["total_results"] += len(docs)

        if "equipment" in types:
            equip = await self._search_equipment(
                search_pattern, study_id, site_id, site_ids
            )
            results["equipment"] = equip
            results["total_results"] += len(equip)

        if "consumable" in types:
            cons = await self._search_consumables(
                search_pattern, study_id, site_id, site_ids
            )
            results["consumables"] = cons
            results["total_results"] += len(cons)

        return results

    async def _search_documents(
        self,
        pattern: str,
        study_id: Optional[UUID],
        site_id: Optional[UUID],
        allowed_site_ids: Optional[List[UUID]],
    ) -> List[Dict]:
        """Search documents."""
        query = (
            select(Document)
            .options(
                selectinload(Document.study),
                selectinload(Document.site),
            )
            .where(
                or_(
                    StoredItem.description.ilike(pattern),
                    StoredItem.internal_code.ilike(pattern),
                    Document.subject_id.ilike(pattern),
                    Document.form_name.ilike(pattern),
                )
            )
        )

        if study_id:
            query = query.where(StoredItem.study_id == study_id)
        if site_id:
            query = query.where(StoredItem.site_id == site_id)
        if allowed_site_ids:
            query = query.where(StoredItem.site_id.in_(allowed_site_ids))

        query = query.limit(20)
        result = await self.db.execute(query)
        documents = result.scalars().all()

        return [
            {
                "id": str(doc.id),
                "type": "DOCUMENT",
                "document_type": doc.document_type,
                "subject_id": doc.subject_id,
                "description": doc.description,
                "status": doc.status,
                "study": {"protocol_number": doc.study.protocol_number} if doc.study else None,
                "site": {"name": doc.site.name} if doc.site else None,
            }
            for doc in documents
        ]

    async def _search_equipment(
        self,
        pattern: str,
        study_id: Optional[UUID],
        site_id: Optional[UUID],
        allowed_site_ids: Optional[List[UUID]],
    ) -> List[Dict]:
        """Search equipment."""
        query = (
            select(Equipment)
            .options(
                selectinload(Equipment.study),
                selectinload(Equipment.site),
            )
            .where(
                or_(
                    StoredItem.description.ilike(pattern),
                    StoredItem.internal_code.ilike(pattern),
                    Equipment.serial_number.ilike(pattern),
                    Equipment.model.ilike(pattern),
                    Equipment.manufacturer.ilike(pattern),
                )
            )
        )

        if study_id:
            query = query.where(StoredItem.study_id == study_id)
        if site_id:
            query = query.where(StoredItem.site_id == site_id)
        if allowed_site_ids:
            query = query.where(StoredItem.site_id.in_(allowed_site_ids))

        query = query.limit(20)
        result = await self.db.execute(query)
        equipment = result.scalars().all()

        return [
            {
                "id": str(eq.id),
                "type": "EQUIPMENT",
                "equipment_type": eq.equipment_type,
                "serial_number": eq.serial_number,
                "model": eq.model,
                "manufacturer": eq.manufacturer,
                "description": eq.description,
                "status": eq.status,
                "study": {"protocol_number": eq.study.protocol_number} if eq.study else None,
                "site": {"name": eq.site.name} if eq.site else None,
            }
            for eq in equipment
        ]

    async def _search_consumables(
        self,
        pattern: str,
        study_id: Optional[UUID],
        site_id: Optional[UUID],
        allowed_site_ids: Optional[List[UUID]],
    ) -> List[Dict]:
        """Search consumables."""
        query = (
            select(Consumable)
            .options(
                selectinload(Consumable.study),
                selectinload(Consumable.site),
            )
            .where(
                or_(
                    StoredItem.description.ilike(pattern),
                    StoredItem.internal_code.ilike(pattern),
                    Consumable.lot_number.ilike(pattern),
                    Consumable.catalog_number.ilike(pattern),
                    Consumable.manufacturer.ilike(pattern),
                )
            )
        )

        if study_id:
            query = query.where(StoredItem.study_id == study_id)
        if site_id:
            query = query.where(StoredItem.site_id == site_id)
        if allowed_site_ids:
            query = query.where(StoredItem.site_id.in_(allowed_site_ids))

        query = query.limit(20)
        result = await self.db.execute(query)
        consumables = result.scalars().all()

        return [
            {
                "id": str(cons.id),
                "type": "CONSUMABLE",
                "consumable_type": cons.consumable_type,
                "lot_number": cons.lot_number,
                "manufacturer": cons.manufacturer,
                "description": cons.description,
                "status": cons.status,
                "expiry_date": str(cons.expiry_date) if cons.expiry_date else None,
                "study": {"protocol_number": cons.study.protocol_number} if cons.study else None,
                "site": {"name": cons.site.name} if cons.site else None,
            }
            for cons in consumables
        ]
