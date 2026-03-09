"""
Core API Service - FastAPI Application
Main CRUD operations for all resources.
Port: 8001
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

from common.config import get_settings
from common.database import init_db, close_db
from common.middleware import setup_cors, setup_error_handlers
from common.utils.logger import setup_logging, get_logger

from .routes import (
    studies, sites, documents, equipment, consumables,
    storage, users, search, movements, access_requests, audit,
    roles, system_settings,
)

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    setup_logging()
    logger.info("Starting Core API Service", version=app.version)
    await init_db()
    yield
    logger.info("Shutting down Core API Service")
    await close_db()


app = FastAPI(
    title="Core API - Clinical Storage System",
    description="Main CRUD operations for Clinical Storage System",
    version="1.0.0",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    lifespan=lifespan,
)

# Middleware
setup_cors(app)
setup_error_handlers(app)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Routes
app.include_router(studies.router, prefix="/api/v1/studies", tags=["Studies"])
app.include_router(sites.router, prefix="/api/v1/sites", tags=["Sites"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(equipment.router, prefix="/api/v1/equipment", tags=["Equipment"])
app.include_router(consumables.router, prefix="/api/v1/consumables", tags=["Consumables"])
app.include_router(storage.router, prefix="/api/v1", tags=["Storage"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(search.router, prefix="/api/v1/search", tags=["Search"])
app.include_router(movements.router, prefix="/api/v1/movements", tags=["Movements"])
app.include_router(access_requests.router, prefix="/api/v1/access-requests", tags=["Access Requests"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["Audit Trail"])
app.include_router(roles.router, prefix="/api/v1/roles", tags=["Roles"])
app.include_router(system_settings.router, prefix="/api/v1/system-settings", tags=["System Settings"])


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "core-api"}
