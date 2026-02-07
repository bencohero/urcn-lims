"""Pytest configuration and fixtures for auth service tests."""

import asyncio
from typing import AsyncGenerator
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.database.base import Base
from common.database import get_db
from common.models import User, Role
from common.auth.password import hash_password

from app.main import app


# Test database URL
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
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests."""
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database override."""

    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_role(db: AsyncSession) -> Role:
    """Create a test role."""
    role = Role(
        name="Test Role",
        code="TEST",
        permissions={
            "documents": {"create": True, "read": True, "update": True, "delete": False}
        },
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role


@pytest_asyncio.fixture
async def test_user(db: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        password_hash=hash_password("TestPassword123!"),
        first_name="Test",
        last_name="User",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
