"""
Auth Service - FastAPI Application
Handles authentication, authorization, and user session management.
Port: 8000
"""

from contextlib import asynccontextmanager

import redis.asyncio as redis

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware


from sqlalchemy import text

from common.config import get_settings
from common.database import init_db, close_db
from common.middleware import setup_cors, setup_error_handlers
from common.utils.logger import setup_logging, get_logger


from .routes import auth

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    setup_logging()
    logger.info("Starting Auth Service", version=app.version)
    await init_db()
    app.state.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    yield
    # Shutdown
    logger.info("Shutting down Auth Service")
    await app.state.redis.aclose()
    await close_db()


app = FastAPI(
    title="Auth Service - Clinical Storage System",
    description=(
        "Authentication and authorization service for Clinical Storage System"
    ),
    version="1.0.0",
    openapi_url="/api/v1/auth/openapi.json",
    docs_url="/api/v1/auth/docs",
    redoc_url="/api/v1/auth/redoc",
    lifespan=lifespan,
)

# Middleware
setup_cors(app)
setup_error_handlers(app)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "auth-service"}


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Readiness check endpoint."""
    from common.database import engine

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "not ready", "database": str(e)}
