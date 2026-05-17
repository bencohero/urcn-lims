# Multi-stage build for auth-service
# Build context must be ./backend (to include common/)
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create isolated virtual environment
RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Install Python production dependencies
COPY auth-service/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser

# Copy virtualenv from builder
COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# PYTHONPATH allows Python to resolve `common` and `auth-service` packages
ENV PYTHONPATH="/app"

# Copy common package (shared across all services)
COPY common/ /app/common/

# Copy service application code
COPY auth-service/ /app/auth-service/

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

USER appuser

WORKDIR /app/auth-service

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 2 workers par défaut ; surcharger via UVICORN_WORKERS en prod
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS:-2}"]
