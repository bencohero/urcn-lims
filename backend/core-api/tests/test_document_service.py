"""Tests for DocumentService."""

import pytest
from datetime import date
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend/core-api")

from common.models import Document, Site, SiteUser, Study, User, Container
from common.schemas.document import DocumentCreate, DocumentUpdate
from app.services.document_service import DocumentService


@pytest.mark.asyncio
class TestDocumentServiceGetDocuments:
    """Tests for DocumentService.get_documents."""

    async def test_get_documents_empty(self, db: AsyncSession, admin_user: User):
        service = DocumentService(db)
        docs, total = await service.get_documents(user=admin_user)
        assert total == 0

    async def test_get_documents_returns_all(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = DocumentService(db)
        docs, total = await service.get_documents(user=admin_user)
        assert total == 1
        assert docs[0].id == stored_item_document.id

    async def test_get_documents_filter_by_study(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document, study: Study
    ):
        service = DocumentService(db)
        docs, total = await service.get_documents(study_id=study.id, user=admin_user)
        assert total == 1

        docs, total = await service.get_documents(study_id=uuid4(), user=admin_user)
        assert total == 0

    async def test_get_documents_filter_by_type(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = DocumentService(db)
        docs, total = await service.get_documents(document_type="CONSENT", user=admin_user)
        assert total == 1

        docs, total = await service.get_documents(document_type="CRF", user=admin_user)
        assert total == 0

    async def test_get_documents_filter_by_subject(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = DocumentService(db)
        docs, total = await service.get_documents(subject_id="SUBJ-001", user=admin_user)
        assert total == 1

    async def test_get_documents_rls(
        self, db: AsyncSession, regular_user: User, stored_item_document: Document, site_user_assignment: SiteUser
    ):
        service = DocumentService(db)
        docs, total = await service.get_documents(user=regular_user)
        assert total == 1


@pytest.mark.asyncio
class TestDocumentServiceGetById:
    """Tests for DocumentService.get_document_by_id."""

    async def test_get_document_by_id(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = DocumentService(db)
        result = await service.get_document_by_id(stored_item_document.id, admin_user)
        assert result is not None
        assert result.document_type == "CONSENT"

    async def test_get_document_by_id_not_found(self, db: AsyncSession, admin_user: User):
        service = DocumentService(db)
        result = await service.get_document_by_id(uuid4(), admin_user)
        assert result is None


@pytest.mark.asyncio
class TestDocumentServiceCreate:
    """Tests for DocumentService.create_document."""

    async def test_create_document(
        self, db: AsyncSession, admin_user: User, study: Study, site: Site, container: Container
    ):
        service = DocumentService(db)
        data = DocumentCreate(
            study_id=study.id,
            site_id=site.id,
            container_id=container.id,
            internal_code="DOC-NEW",
            description="New CRF",
            quantity=1,
            storage_date=date(2026, 2, 1),
            physical_condition="GOOD",
            document_type="CRF",
            subject_id="SUBJ-002",
            visit_number=2,
            form_name="CRF v2.0",
            version="2.0",
            page_count=8,
            original_language="EN",
            confidentiality_level="MEDIUM",
        )
        doc = await service.create_document(data, admin_user)
        assert doc.id is not None
        assert doc.document_type == "CRF"
        assert doc.subject_id == "SUBJ-002"


@pytest.mark.asyncio
class TestDocumentServiceUpdate:
    """Tests for DocumentService.update_document."""

    async def test_update_document(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = DocumentService(db)
        data = DocumentUpdate(confidentiality_level="CRITICAL")
        result = await service.update_document(stored_item_document.id, data, admin_user)
        assert result is not None
        assert result.confidentiality_level == "CRITICAL"


@pytest.mark.asyncio
class TestDocumentServiceDelete:
    """Tests for DocumentService.delete_document."""

    async def test_delete_document(
        self, db: AsyncSession, admin_user: User, stored_item_document: Document
    ):
        service = DocumentService(db)
        success = await service.delete_document(stored_item_document.id, admin_user)
        assert success is True

        # Verify it's archived
        doc = await service.get_document_by_id(stored_item_document.id, admin_user)
        assert doc.status == "ARCHIVED"

    async def test_delete_document_not_found(self, db: AsyncSession, admin_user: User):
        service = DocumentService(db)
        success = await service.delete_document(uuid4(), admin_user)
        assert success is False
