"""
Async database session management with SQLAlchemy 2.0.
"""

from collections.abc import AsyncGenerator
from typing import Optional

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from common.config import get_settings

settings = get_settings()

# Create async engine with connection pooling
engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_pre_ping=True,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions.
    Yields an async session and ensures proper cleanup.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize database connection.
    Called on application startup.
    """
    from common.database.base import Base

    async with engine.begin() as conn:
        # Create tables if they don't exist (for development only)
        if settings.is_development:
            await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """
    Close database connections.
    Called on application shutdown.
    """
    await engine.dispose()


class DatabaseManager:
    """Context manager for database operations."""

    def __init__(self, session: Optional[AsyncSession] = None):
        self._session = session
        self._owns_session = session is None

    async def __aenter__(self) -> AsyncSession:
        if self._owns_session:
            self._session = AsyncSessionLocal()
        return self._session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._owns_session and self._session:
            if exc_type:
                await self._session.rollback()
            await self._session.close()
