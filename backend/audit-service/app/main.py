"""Audit Service - Main application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.config import get_settings
from common.database import init_db, close_db
from common.middleware import setup_error_handlers
from common.utils.logger import get_logger

from .routes import audit

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Audit Service")
    await init_db()
    yield
    logger.info("Shutting down Audit Service")
    await close_db()


app = FastAPI(
    title="Clinical Storage - Audit Service",
    description="Immutable audit trail management for Clinical Storage System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handler
setup_error_handlers(app)

# Routes
app.include_router(audit.router, prefix="/api/v1/audit-trail", tags=["Audit Trail"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "audit-service"}
