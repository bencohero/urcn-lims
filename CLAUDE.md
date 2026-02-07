# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clinical Storage System - A multi-site storage management system for physical documents and laboratory equipment in clinical trials. Built for GCP/ICH and GDPR compliance with RFID integration, offline support, and immutable audit trails.

**Scale:** 7 sites, 400 users, 10-year data retention

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Vite 5, React Router v6, Zustand, React Query, Tailwind CSS |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, Celery |
| Database | PostgreSQL 15+ |
| Infrastructure | Docker, Nginx, Redis, RabbitMQ, MinIO |

## Architecture

### Microservices (Backend)

```
nginx:80/443 → API Gateway
├── auth-service:8000      # JWT auth, RBAC, user management
├── core-api:8001          # CRUD studies, sites, documents, equipment
├── rfid-service:8002      # Tag encoding, reading, bulk inventory
├── workflow-engine:8003   # Access requests, approvals, state machine
├── notification-service:8004 # Email, in-app alerts, Celery workers
├── reporting-service:8005 # PDF/Excel/CSV exports, statistics
└── audit-service:8006     # Immutable audit trail, integrity verification
```

### Frontend Structure

```
frontend/src/
├── components/ui/         # Reusable UI components
├── components/features/   # Feature-specific components
├── pages/                 # Route pages
├── hooks/                 # Custom React hooks (useDocuments, etc.)
├── lib/api/              # API clients
└── store/                # Zustand stores
```

### Backend Structure (per service)

```
backend/{service}/app/
├── models/               # SQLAlchemy models
├── schemas/              # Pydantic request/response schemas
├── routes/               # FastAPI endpoints
├── services/             # Business logic
├── dependencies.py       # FastAPI dependencies
└── main.py              # App entry point
```

## Commands

### Docker (Full Stack)

```bash
docker-compose up -d --build    # Start all services
docker-compose logs -f backend  # View logs
docker-compose down -v          # Stop and cleanup
docker-compose exec {service} bash  # Shell into container
```

### Backend

```bash
# Dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

# Database migrations
alembic revision -m "description"   # Create migration
alembic upgrade head                # Apply migrations

# Testing
pytest --cov=app --cov-report=html

# Linting
flake8 app/
black app/
```

### Frontend

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run test     # Run tests
npm run lint     # ESLint check
npm run lint:fix # Auto-fix lint issues
```

## Key Patterns

### API Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed",
  "timestamp": "2026-02-04T10:30:00Z"
}
```

### Database Conventions

- Use SQLAlchemy 2.0 style (`select()`)
- All tables have `id` (UUID), `created_at`, `updated_at`
- Audit trail is append-only with hash chaining (blockchain-like integrity)
- Row-Level Security (RLS) filters data by user's assigned sites

### RBAC Roles

Admin, Investigator, ARC, Monitor, Archivist, Data Manager, Data Clerk

### Access Request Workflow

```
PENDING → APPROVED/REJECTED → FULFILLED → RETURNED
```
- 24h approval SLA with auto-alerts
- 7-day default loan duration, 1 extension allowed

### Offline Mode

- IndexedDB (Dexie.js) for local storage
- Last-write-wins conflict resolution with user notification
- Background sync on reconnection

## Domain-Specific Knowledge

### Item Types

- **Documents:** CONSENT, CRF, SOURCE_DOC (stored with subject_id, visit_number)
- **Equipment:** CENTRIFUGE, REFRIGERATOR (calibration tracking)
- **Consumables:** REAGENT, TUBE (lot/expiry tracking)

### RFID

- Protocol: UHF Gen2 (EPC Class 1)
- EPC: 96 bits (Header + Company Prefix + Item Reference + Serial)
- Tags table links `associated_item_id` + `associated_item_type`

### Audit Trail

Every mutation logs: user, timestamp, old/new values, IP, SHA-256 hash chain. The audit table uses PostgreSQL triggers to prevent UPDATE/DELETE.

## Reference Documentation

| Topic | File |
|-------|------|
| Architecture | `docs/ARCHITECTURE_GLOBALE.md` |
| Database Schema | `docs/DATABASE_SCHEMA.md` |
| API Specs | `docs/API_SPECIFICATIONS.md` |
| UI Mockups | `docs/UI_MOCKUPS.md` |
| Test Plan | `docs/TEST_PLAN.md` |
