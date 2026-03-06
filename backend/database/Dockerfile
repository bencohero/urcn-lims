FROM python:3.11-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

# Only what's needed for migrations
RUN pip install --no-cache-dir \
    sqlalchemy[asyncio]==2.0.25 \
    asyncpg==0.29.0 \
    alembic==1.13.1 \
    pydantic==2.5.3 \
    pydantic-settings==2.1.0 \
    python-dotenv==1.0.0


FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

COPY common/ /app/common/
COPY database/ /app/database/

WORKDIR /app/database

CMD ["alembic", "upgrade", "head"]
