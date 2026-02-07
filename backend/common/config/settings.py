"""
Application settings using Pydantic Settings.
All configuration is loaded from environment variables.
"""

from functools import lru_cache
import json
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env.dev",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "Clinical Storage System"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://clinical_admin:clinical_admin_password@localhost:5433/clinical_storage"
    )
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_ECHO: bool = False

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    REDIS_MAX_CONNECTIONS: int = 10

    # RabbitMQ
    RABBITMQ_URL: Optional[str] = Field(default=None)

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(default="your-secret-key-change-in-production")
    JWT_ALGORITHM: str = "RS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    JWT_PRIVATE_KEY_PATH: Optional[str] = None
    JWT_PUBLIC_KEY_PATH: Optional[str] = None

    # Security
    PASSWORD_MIN_LENGTH: int = 12
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 30
    CORS_ORIGINS: List[str] = Field(default=["http://localhost:3000"])

    """ @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)  # cas JSON
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]  # cas CSV
        return v """
    # SMTP Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@clinical-storage.local"
    SMTP_FROM_NAME: str = "Clinical Storage System"
    SMTP_TLS: bool = True

    # MinIO Object Storage
    MINIO_ENDPOINT: Optional[str] = None
    MINIO_ACCESS_KEY: Optional[str] = None
    MINIO_SECRET_KEY: Optional[str] = None
    MINIO_SECURE: bool = False
    MINIO_BUCKET_REPORTS: str = "reports"
    MINIO_BUCKET_DOCUMENTS: str = "documents"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    # Pagination
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 100

    # Business Rules
    ACCESS_REQUEST_DEFAULT_DURATION_DAYS: int = 7
    ACCESS_REQUEST_MAX_EXTENSION_DAYS: int = 7
    APPROVAL_REMINDER_HOURS: int = 24
    OVERDUE_ALERT_DELAY_HOURS: int = 12
    STORAGE_CAPACITY_WARNING_PERCENT: int = 90
    DEFAULT_RETENTION_YEARS: int = 10

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
