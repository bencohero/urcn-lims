"""Pytest configuration and fixtures for core-api service tests."""

import asyncio
from datetime import date, datetime
from typing import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

# Teach SQLite to handle PostgreSQL-specific column types
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
SQLiteTypeCompiler.visit_UUID = lambda self, type_, **kw: "CHAR(36)"
SQLiteTypeCompiler.visit_JSONB = lambda self, type_, **kw: "JSON"
SQLiteTypeCompiler.visit_INET = lambda self, type_, **kw: "VARCHAR(45)"

from common.database.base import Base
from common.models import (
    AccessRequest,
    AuditTrail,
    Consumable,
    Container,
    Document,
    Equipment,
    Movement,
    Role,
    Site,
    SiteUser,
    StorageLocation,
    StoredItem,
    Study,
    User,
)
from common.auth.password import hash_password


# SQLite in-memory for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def engine():
    """Create async engine for tests."""
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield test_engine
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests."""
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
        await session.rollback()


# ──────────────────────────────────────────────
# Role fixtures
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def admin_role(db: AsyncSession) -> Role:
    """Create an admin role with all permissions."""
    role = Role(
        name="Admin",
        code="ADMIN",
        permissions={
            "*": {"create": True, "read": True, "update": True, "delete": True, "approve": True, "fulfill": True},
        },
        is_system_role=True,
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@pytest_asyncio.fixture
async def investigator_role(db: AsyncSession) -> Role:
    """Create an investigator role with limited permissions."""
    role = Role(
        name="Investigator",
        code="INVESTIGATOR",
        permissions={
            "documents": {"create": True, "read": True, "update": True, "delete": False},
            "equipment": {"create": True, "read": True, "update": True, "delete": False},
            "consumables": {"create": True, "read": True, "update": True, "delete": False},
            "movements": {"create": True, "read": True, "update": True},
            "storage": {"create": True, "read": True, "update": True},
            "access_requests": {"create": True, "read": True, "approve": True, "fulfill": True},
            "audit": {"read": True},
            "users": {"read": True},
        },
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


# ──────────────────────────────────────────────
# User fixtures
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def admin_user(db: AsyncSession) -> User:
    """Create an admin (superuser) user."""
    user = User(
        username="admin",
        email="admin@example.com",
        password_hash=hash_password("AdminPassword123!"),
        first_name="Admin",
        last_name="User",
        is_active=True,
        is_superuser=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest_asyncio.fixture
async def regular_user(db: AsyncSession) -> User:
    """Create a regular (non-superuser) user."""
    user = User(
        username="jdoe",
        email="jdoe@example.com",
        password_hash=hash_password("RegularPassword123!"),
        first_name="John",
        last_name="Doe",
        is_active=True,
        is_superuser=False,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


# ──────────────────────────────────────────────
# Study / Site fixtures
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def study(db: AsyncSession) -> Study:
    """Create a test study."""
    s = Study(
        protocol_number="PROTO-001",
        title="Test Clinical Study",
        sponsor="Test Sponsor",
        phase="Phase III",
        therapeutic_area="Oncology",
        start_date=date(2026, 1, 1),
        status="ACTIVE",
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@pytest_asyncio.fixture
async def site(db: AsyncSession, study: Study, admin_user: User) -> Site:
    """Create a test site."""
    s = Site(
        study_id=study.id,
        site_number="SITE-001",
        name="Test Hospital",
        country="France",
        city="Paris",
        status="ACTIVE",
    )
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return s


@pytest_asyncio.fixture
async def site_user_assignment(
    db: AsyncSession, regular_user: User, site: Site, investigator_role: Role
) -> SiteUser:
    """Assign the regular user to the test site with investigator role."""
    su = SiteUser(
        user_id=regular_user.id,
        site_id=site.id,
        role_id=investigator_role.id,
        is_primary=True,
    )
    db.add(su)
    await db.commit()
    await db.refresh(su)
    # Refresh user to pick up site_users relationship
    await db.refresh(regular_user)
    return su


# ──────────────────────────────────────────────
# Storage fixtures
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def storage_location(db: AsyncSession, site: Site) -> StorageLocation:
    """Create a test storage location."""
    loc = StorageLocation(
        site_id=site.id,
        name="Room A-101",
        code="A101",
        location_type="ROOM",
        temperature_controlled=True,
        temperature_min=15.0,
        temperature_max=25.0,
        status="ACTIVE",
    )
    db.add(loc)
    await db.commit()
    await db.refresh(loc)
    return loc


@pytest_asyncio.fixture
async def container(db: AsyncSession, storage_location: StorageLocation) -> Container:
    """Create a test container."""
    c = Container(
        location_id=storage_location.id,
        container_type="CABINET",
        name="Cabinet A",
        code="CAB-A",
        capacity_items=100,
        current_count=5,
        status="ACTIVE",
    )
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return c


# ──────────────────────────────────────────────
# Stored item fixtures
# ──────────────────────────────────────────────

@pytest_asyncio.fixture
async def stored_item_document(
    db: AsyncSession, study: Study, site: Site, container: Container, admin_user: User
) -> Document:
    """Create a test document (stored item) via polymorphic inheritance."""
    doc = Document(
        study_id=study.id,
        site_id=site.id,
        container_id=container.id,
        internal_code="DOC-001",
        description="Consent form",
        quantity=1,
        storage_date=date(2026, 1, 15),
        status="IN_STORAGE",
        created_by=admin_user.id,
        document_type="CONSENT",
        subject_id="SUBJ-001",
        visit_number="1",
        form_name="ICF v1.0",
        version="1.0",
        page_count=12,
        original_language="FR",
        confidentiality_level="HIGH",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc


@pytest_asyncio.fixture
async def stored_item_equipment(
    db: AsyncSession, study: Study, site: Site, container: Container, admin_user: User
) -> Equipment:
    """Create a test equipment (stored item) via polymorphic inheritance."""
    eq = Equipment(
        study_id=study.id,
        site_id=site.id,
        container_id=container.id,
        internal_code="EQ-001",
        description="Lab centrifuge",
        quantity=1,
        storage_date=date(2026, 1, 10),
        status="IN_STORAGE",
        created_by=admin_user.id,
        equipment_type="CENTRIFUGE",
        manufacturer="Eppendorf",
        model="5424R",
        serial_number="SN-12345",
        calibration_required=True,
        last_calibration_date=date(2025, 12, 1),
        next_calibration_date=date(2026, 6, 1),
        operational_status="OPERATIONAL",
    )
    db.add(eq)
    await db.commit()
    await db.refresh(eq)
    return eq


@pytest_asyncio.fixture
async def stored_item_consumable(
    db: AsyncSession, study: Study, site: Site, container: Container, admin_user: User
) -> Consumable:
    """Create a test consumable (stored item) via polymorphic inheritance."""
    cons = Consumable(
        study_id=study.id,
        site_id=site.id,
        container_id=container.id,
        internal_code="CONS-001",
        description="Blood collection tubes",
        quantity=50,
        unit="BOX",
        storage_date=date(2026, 1, 5),
        status="IN_STORAGE",
        created_by=admin_user.id,
        consumable_type="TUBE",
        manufacturer="BD Vacutainer",
        catalog_number="CAT-9876",
        lot_number="LOT-2026-A",
        expiry_date=date(2027, 6, 30),
        storage_conditions="Room temperature",
        hazardous=False,
        minimum_stock_level=10,
        reorder_point=20,
    )
    db.add(cons)
    await db.commit()
    await db.refresh(cons)
    return cons
