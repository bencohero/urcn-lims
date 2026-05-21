"""Document service."""

from datetime import date, datetime
from typing import List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


from common.models import Document, StoredItem, User, Container, StorageLocation
from common.schemas.document import DocumentCreate, DocumentUpdate
from common.auth.permissions import PermissionChecker

from .audit_service import AuditService


class DocumentService:
    """Service for document operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)

    async def get_documents(
        self,
        study_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        document_type: Optional[str] = None,
        status: Optional[str] = None,
        subject_id: Optional[str] = None,
        search: Optional[str] = None,
        from_date: Optional[date] = None,
        to_date: Optional[date] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None,
    ) -> Tuple[List[Document], int]:
        """Get documents with filters and pagination."""
        query = (
            select(Document)
            .options(
                selectinload(Document.study),
                selectinload(Document.site),
                selectinload(Document.container).selectinload(Container.location),
            )
        )

        # Build filters
        filters = []
        if study_id:
            filters.append(StoredItem.study_id == study_id)
        if site_id:
            filters.append(StoredItem.site_id == site_id)
        if document_type:
            filters.append(Document.document_type == document_type)
        if status:
            filters.append(StoredItem.status == status)
        if subject_id:
            filters.append(Document.subject_id == subject_id)
        if search:
            filters.append(
                or_(
                    StoredItem.description.ilike(f"%{search}%"),
                    Document.subject_id.ilike(f"%{search}%"),
                    StoredItem.internal_code.ilike(f"%{search}%"),
                )
            )
        if from_date:
            filters.append(StoredItem.storage_date >= from_date)
        if to_date:
            filters.append(StoredItem.storage_date <= to_date)

        # Apply RLS filter
        if user and not user.is_superuser:
            checker = PermissionChecker(user)
            filters.append(StoredItem.site_id.in_(checker.site_ids))

        if filters:
            query = query.where(and_(*filters))

        # Count total
        count_query = select(func.count()).select_from(Document)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(StoredItem.created_at.desc())

        result = await self.db.execute(query)
        documents = result.scalars().all()

        return documents, total

    async def get_document_by_id(
        self, document_id: UUID, user: User
    ) -> Optional[Document]:
        """Get document by ID with permission check."""
        query = (
            select(Document)
            .where(Document.id == document_id)
            .options(
                selectinload(Document.study),
                selectinload(Document.site),
                selectinload(Document.container).selectinload(Container.location),
                selectinload(Document.movements),
                selectinload(Document.access_requests),
            )
        )
        result = await self.db.execute(query)
        document = result.scalar_one_or_none()

        if document and not user.is_superuser:
            checker = PermissionChecker(user)
            if document.site_id not in checker.site_ids:
                return None

        return document

    async def _generate_internal_code(self) -> str:
        """Generate next DOC-YYYY-NNNNN code for the current year."""
        year = datetime.now().year
        prefix = f"DOC-{year}-"
        result = await self.db.execute(
            select(StoredItem.internal_code)
            .where(
                and_(
                    StoredItem.item_type == "DOCUMENT",
                    StoredItem.internal_code.like(f"{prefix}%"),
                )
            )
        )
        codes = result.scalars().all()
        max_seq = 0
        for code in codes:
            try:
                seq = int(code[len(prefix):])
                if seq > max_seq:
                    max_seq = seq
            except (ValueError, TypeError):
                pass
        return f"{prefix}{max_seq + 1:05d}"

    async def create_document(
        self, document_data: DocumentCreate, user: User
    ) -> Document:
        """Create a new document."""
        internal_code = document_data.internal_code or await self._generate_internal_code()
        document = Document(
            study_id=document_data.study_id,
            site_id=document_data.site_id,
            container_id=document_data.container_id,
            internal_code=internal_code,
            description=document_data.description,
            quantity=document_data.quantity,
            unit=document_data.unit,
            storage_date=document_data.storage_date,
            expected_retention_until=document_data.expected_retention_until,
            physical_condition=document_data.physical_condition,
            location_notes=document_data.location_notes,
            status="IN_STORAGE",
            created_by=user.id,
            document_type=document_data.document_type,
            subject_id=document_data.subject_id,
            visit_number=document_data.visit_number,
            form_name=document_data.form_name,
            version=document_data.version,
            page_count=document_data.page_count,
            original_language=document_data.original_language,
            signature_required=document_data.signature_required,
            signed_date=document_data.signed_date,
            confidentiality_level=document_data.confidentiality_level,
            retention_category=document_data.retention_category,
        )
        self.db.add(document)

        # Audit
        await self.audit_service.log_action(
            event_type="CREATE",
            table_name="documents",
            record_id=document.id,
            user_id=user.id,
            new_values=document_data.model_dump(mode="json"),
        )

        await self.db.commit()

        # Reload with relationships to avoid lazy-load issues
        result = await self.db.execute(
            select(Document)
            .where(Document.id == document.id)
            .options(
                selectinload(Document.study),
                selectinload(Document.site),
                selectinload(Document.container).selectinload(Container.location),
            )
        )
        return result.scalar_one()

    async def update_document(
        self, document_id: UUID, document_data: DocumentUpdate, user: User
    ) -> Optional[Document]:
        """Update a document."""
        document = await self.get_document_by_id(document_id, user)
        if not document:
            return None

        update_data = document_data.model_dump(exclude_unset=True)

        # Capture old values for audit from the same keys being updated
        old_values = {}
        for key in update_data:
            val = getattr(document, key, None)
            old_values[key] = str(val) if val is not None else None

        # All fields (StoredItem + Document) are directly on document due to joined-table inheritance
        for key, value in update_data.items():
            setattr(document, key, value)

        document.updated_by = user.id

        await self.audit_service.log_action(
            event_type="UPDATE",
            table_name="documents",
            record_id=document.id,
            user_id=user.id,
            old_values=old_values,
            new_values={k: str(v) if v is not None else None for k, v in update_data.items()},
        )

        await self.db.commit()

        # Re-query with relationships to avoid MissingGreenlet after commit
        result = await self.db.execute(
            select(Document)
            .where(Document.id == document.id)
            .options(
                selectinload(Document.study),
                selectinload(Document.site),
                selectinload(Document.container).selectinload(Container.location),
            )
        )
        return result.scalar_one()

    async def delete_document(
        self, document_id: UUID, user: User
    ) -> bool:
        """Soft delete (archive) a document."""
        document = await self.get_document_by_id(document_id, user)
        if not document:
            return False

        # Soft delete by changing status
        document.status = "ARCHIVED"
        document.updated_by = user.id

        # Audit
        await self.audit_service.log_action(
            event_type="DELETE",
            table_name="documents",
            record_id=document.id,
            user_id=user.id,
            action="Document archived",
        )

        await self.db.commit()
        return True
