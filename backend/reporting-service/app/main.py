"""Reporting Service - Main application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.config import get_settings
from common.database import init_db, close_db
from common.middleware import setup_error_handler
from common.utils.logger import get_logger

from .routes import reports

settings = get_settings()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Reporting Service")
    await init_db()
    yield
    logger.info("Shutting down Reporting Service")
    await close_db()


app = FastAPI(
    title="Clinical Storage - Reporting Service",
    description="Report generation for Clinical Storage System",
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
setup_error_handler(app)

# Routes
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "reporting-service"}
