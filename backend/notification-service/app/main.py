"""Notification Service - Main application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import sys
sys.path.insert(0, "/home/skamboule/claude-code/urcn-lims/backend")

from common.config import get_settings
from common.database import init_db, close_db
from common.middleware import setup_error_handler
from common.utils.logger import get_logger

from .routes import notifications
from .services.websocket_service import ConnectionManager

settings = get_settings()
logger = get_logger(__name__)

# WebSocket connection manager
ws_manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Notification Service")
    await init_db()
    yield
    logger.info("Shutting down Notification Service")
    await close_db()


app = FastAPI(
    title="Clinical Storage - Notification Service",
    description="Notification management for Clinical Storage System",
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
app.include_router(
    notifications.router, prefix="/api/v1/notifications", tags=["Notifications"]
)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "notification-service",
        "websocket_connections": ws_manager.active_connections_count,
    }


@app.websocket("/ws/notifications")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time notifications."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Handle ping/pong or other client messages
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")
