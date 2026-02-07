"""RFID service for tag management."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.models import RFIDTag, StoredItem, User
from common.schemas.rfid import RFIDTagCreate
from common.utils.logger import get_logger

from .tag_encoding import TagEncoder

logger = get_logger(__name__)


class RFIDService:
    """Service for RFID tag operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.encoder = TagEncoder()

    async def encode_tag(self, tag_data: RFIDTagCreate, user: User) -> RFIDTag:
        """
        Encode a new RFID tag.

        Args:
            tag_data: Tag creation data
            user: Current user

        Returns:
            Created RFID tag
        """
        # Generate EPC if not provided
        epc = tag_data.epc
        if not epc:
            epc = self.encoder.generate_epc(
                item_type=tag_data.associated_item_type,
                item_id=tag_data.associated_item_id,
            )

        # Create tag
        tag = RFIDTag(
            epc=epc,
            tid=tag_data.tid,
            tag_type=tag_data.tag_type or "UHF_GEN2",
            associated_item_id=tag_data.associated_item_id,
            associated_item_type=tag_data.associated_item_type,
            user_memory=tag_data.user_memory,
            encoding_date=datetime.utcnow(),
            status="ACTIVE",
        )
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)

        logger.info(
            "RFID tag encoded",
            tag_id=str(tag.id),
            epc=tag.epc,
            item_id=str(tag.associated_item_id),
            user_id=str(user.id),
        )

        return tag

    async def read_tag(
        self, epc: str, reader_id: str, user: User
    ) -> Optional[Dict[str, Any]]:
        """
        Read an RFID tag and return associated item info.

        Args:
            epc: EPC code
            reader_id: Reader device ID
            user: Current user

        Returns:
            Tag and item information
        """
        query = select(RFIDTag).where(RFIDTag.epc == epc)
        result = await self.db.execute(query)
        tag = result.scalar_one_or_none()

        if not tag:
            return None

        # Update read count and timestamp
        tag.read_count = (tag.read_count or 0) + 1
        tag.last_read_date = datetime.utcnow()
        await self.db.commit()

        # Get associated item
        item_info = None
        if tag.associated_item_id:
            item_query = (
                select(StoredItem)
                .where(StoredItem.id == tag.associated_item_id)
                .options(
                    selectinload(StoredItem.container),
                    selectinload(StoredItem.site),
                )
            )
            item_result = await self.db.execute(item_query)
            item = item_result.scalar_one_or_none()

            if item:
                item_info = {
                    "id": str(item.id),
                    "type": item.item_type,
                    "description": item.description,
                    "status": item.status,
                    "location": {
                        "container": item.container.name if item.container else None,
                        "site": item.site.name if item.site else None,
                    },
                }

        logger.info(
            "RFID tag read",
            epc=epc,
            reader_id=reader_id,
            user_id=str(user.id),
        )

        return {
            "tag": {
                "id": str(tag.id),
                "epc": tag.epc,
                "status": tag.status,
            },
            "item": item_info,
        }

    async def get_tag_by_id(self, tag_id: UUID) -> Optional[RFIDTag]:
        """Get tag by ID."""
        query = select(RFIDTag).where(RFIDTag.id == tag_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_tag_by_epc(self, epc: str) -> Optional[RFIDTag]:
        """Get tag by EPC."""
        query = select(RFIDTag).where(RFIDTag.epc == epc)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def bulk_read(
        self,
        epcs: List[str],
        reader_id: str,
        location_id: Optional[UUID],
        user: User,
    ) -> Dict[str, Any]:
        """
        Bulk read multiple RFID tags (inventory).

        Args:
            epcs: List of EPC codes
            reader_id: Reader device ID
            location_id: Location where reading occurred
            user: Current user

        Returns:
            Bulk read results
        """
        results = []
        successful = 0
        failed = 0

        for epc in epcs:
            tag_result = await self.read_tag(epc, reader_id, user)
            if tag_result:
                results.append({"epc": epc, "item": tag_result.get("item")})
                successful += 1
            else:
                results.append({"epc": epc, "item": None, "error": "Tag not found"})
                failed += 1

        logger.info(
            "Bulk RFID read completed",
            total=len(epcs),
            successful=successful,
            failed=failed,
            reader_id=reader_id,
            user_id=str(user.id),
        )

        return {
            "total_tags_read": len(epcs),
            "successful_reads": successful,
            "failed_reads": failed,
            "tags": results,
        }

    async def deactivate_tag(self, tag_id: UUID, user: User) -> Optional[RFIDTag]:
        """Deactivate an RFID tag."""
        tag = await self.get_tag_by_id(tag_id)
        if not tag:
            return None

        tag.status = "INACTIVE"
        await self.db.commit()
        await self.db.refresh(tag)

        logger.info(
            "RFID tag deactivated",
            tag_id=str(tag_id),
            user_id=str(user.id),
        )

        return tag
