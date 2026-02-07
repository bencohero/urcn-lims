"""Tests for SearchService."""

import pytest

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Consumable, Document, Equipment, User
from app.services.search_service import SearchService


@pytest.mark.asyncio
class TestSearchService:
    """Tests for SearchService.search."""

    async def test_search_empty(self, db: AsyncSession, admin_user: User):
        service = SearchService(db)
        results = await service.search(query="anything", user=admin_user)
        assert results["total_results"] == 0
        assert results["documents"] == []
        assert results["equipment"] == []
        assert results["consumables"] == []

    async def test_search_documents(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = SearchService(db)
        results = await service.search(query="Consent", user=admin_user)
        assert results["total_results"] >= 1
        assert len(results["documents"]) >= 1
        assert results["documents"][0]["type"] == "DOCUMENT"

    async def test_search_equipment(
        self, db: AsyncSession, admin_user: User, stored_item_equipment: Equipment
    ):
        service = SearchService(db)
        results = await service.search(query="Eppendorf", user=admin_user)
        assert results["total_results"] >= 1
        assert len(results["equipment"]) >= 1

    async def test_search_consumables(
        self, db: AsyncSession, admin_user: User, stored_item_consumable: Consumable
    ):
        service = SearchService(db)
        results = await service.search(query="LOT-2026", user=admin_user)
        assert results["total_results"] >= 1
        assert len(results["consumables"]) >= 1

    async def test_search_by_type_filter(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = SearchService(db)
        # Only search documents
        results = await service.search(query="Consent", types=["document"], user=admin_user)
        assert len(results["documents"]) >= 1
        assert results["equipment"] == []
        assert results["consumables"] == []

    async def test_search_by_internal_code(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = SearchService(db)
        results = await service.search(query="DOC-001", user=admin_user)
        assert results["total_results"] >= 1

    async def test_search_no_results(self, db: AsyncSession, admin_user: User):
        service = SearchService(db)
        results = await service.search(query="zzz_nonexistent_zzz", user=admin_user)
        assert results["total_results"] == 0
