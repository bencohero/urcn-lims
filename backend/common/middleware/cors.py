"""CORS middleware configuration."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from common.config import get_settings

settings = get_settings()


def setup_cors(app: FastAPI) -> None:
    """
    Configure CORS middleware for the FastAPI application.

    Args:
        app: FastAPI application instance
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Authorization",
            "Content-Language",
            "Content-Type",
            "Origin",
            "X-Requested-With",
            "X-Request-ID",
        ],
        expose_headers=[
            "Content-Disposition",
            "Content-Length",
            "X-Request-ID",
            "X-Total-Count",
            "X-Page",
            "X-Page-Size",
        ],
        max_age=600,  # Cache preflight for 10 minutes
    )
