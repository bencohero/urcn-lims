# Guide d'Implémentation - Clinical Storage System

## 1. SETUP ENVIRONNEMENT DÉVELOPPEMENT

### 1.1 Prérequis

```bash
# Système
- Ubuntu 22.04 LTS (ou compatible)
- Docker 24.x+
- Docker Compose 2.x+
- Git 2.x+

# Backend
- Python 3.11+
- pip 23.x+
- PostgreSQL 15+ client

# Frontend
- Node.js 20.x LTS
- npm 10.x+

# Outils
- VS Code ou PyCharm
- pgAdmin 4 ou DBeaver
- Postman ou Insomnia
- RFID Reader (hardware - phase 3)
```

---

### 1.2 Installation Initiale

#### Backend Setup

```bash
# Cloner le repo
git clone <repository-url>
cd clinical-storage-system

# Créer environnement virtuel Python
python3.11 -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer dépendances
pip install --upgrade pip
pip install -r requirements.txt

# Variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres
```

**requirements.txt (Backend):**
```txt
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy[asyncio]==2.0.25
asyncpg==0.29.0
alembic==1.13.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[argon2]==1.7.4
python-multipart==0.0.6
argon2-cffi==23.1.0

# CORS & Middleware
fastapi-cors==0.0.6

# Validation & Serialization
email-validator==2.1.0
python-dotenv==1.0.0

# Background Tasks
celery==5.3.6
redis==5.0.1

# File Handling
python-magic==0.4.27
Pillow==10.2.0

# Reporting
reportlab==4.0.9
openpyxl==3.1.2
pandas==2.1.4

# RFID (custom library à développer)
# rfid-reader==0.1.0

# Logging & Monitoring
structlog==24.1.0
python-json-logger==2.0.7

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0
httpx==0.26.0
faker==22.0.0

# Code Quality
black==23.12.1
flake8==7.0.0
mypy==1.8.0
```

---

#### Frontend Setup

```bash
cd frontend

# Installer dépendances
npm install

# Variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local
```

**package.json (Frontend):**
```json
{
  "name": "clinical-storage-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@tanstack/react-query": "^5.17.19",
    "@tanstack/react-query-devtools": "^5.17.19",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "lucide-react": "^0.307.0",
    "date-fns": "^3.0.6",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "recharts": "^2.10.3",
    "jspdf": "^2.5.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "@typescript-eslint/eslint-plugin": "^6.17.0",
    "@typescript-eslint/parser": "^6.17.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

---

#### Docker Setup

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  # PostgreSQL Master
  postgres-master:
    image: postgres:15-alpine
    container_name: clinical-postgres-master
    environment:
      POSTGRES_DB: clinical_storage
      POSTGRES_USER: clinical_admin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    volumes:
      - postgres_master_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - clinical-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U clinical_admin -d clinical_storage"]
      interval: 10s
      timeout: 5s
      retries: 5

  # PostgreSQL Replica (optionnel pour prod)
  postgres-replica:
    image: postgres:15-alpine
    container_name: clinical-postgres-replica
    environment:
      POSTGRES_DB: clinical_storage
      POSTGRES_USER: clinical_admin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    networks:
      - clinical-network
    depends_on:
      - postgres-master
    profiles:
      - production

  # Redis
  redis:
    image: redis:7-alpine
    container_name: clinical-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - clinical-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: clinical-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: clinical
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    networks:
      - clinical-network
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 30s
      timeout: 10s
      retries: 5

  # MinIO
  minio:
    image: minio/minio:latest
    container_name: clinical-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"  # Console
    volumes:
      - minio_data:/data
    networks:
      - clinical-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Auth Service
  auth-service:
    build:
      context: ./backend/auth-service
      dockerfile: Dockerfile
    container_name: clinical-auth-service
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      JWT_ALGORITHM: RS256
    ports:
      - "8000:8000"
    depends_on:
      postgres-master:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - clinical-network
    volumes:
      - ./backend/auth-service:/app
    restart: unless-stopped

  # Core API Service
  core-api:
    build:
      context: ./backend/core-api
      dockerfile: Dockerfile
    container_name: clinical-core-api
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/1
      AUTH_SERVICE_URL: http://auth-service:8000
    ports:
      - "8001:8001"
    depends_on:
      - postgres-master
      - redis
      - auth-service
    networks:
      - clinical-network
    volumes:
      - ./backend/core-api:/app
    restart: unless-stopped

  # RFID Service
  rfid-service:
    build:
      context: ./backend/rfid-service
      dockerfile: Dockerfile
    container_name: clinical-rfid-service
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/2
    ports:
      - "8002:8002"
    depends_on:
      - postgres-master
      - redis
    networks:
      - clinical-network
    volumes:
      - ./backend/rfid-service:/app
    restart: unless-stopped
    # privileged: true  # Si accès hardware USB RFID

  # Workflow Engine
  workflow-engine:
    build:
      context: ./backend/workflow-engine
      dockerfile: Dockerfile
    container_name: clinical-workflow-engine
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/3
      RABBITMQ_URL: amqp://clinical:${RABBITMQ_PASSWORD}@rabbitmq:5672/
    ports:
      - "8003:8003"
    depends_on:
      - postgres-master
      - redis
      - rabbitmq
    networks:
      - clinical-network
    volumes:
      - ./backend/workflow-engine:/app
    restart: unless-stopped

  # Notification Service
  notification-service:
    build:
      context: ./backend/notification-service
      dockerfile: Dockerfile
    container_name: clinical-notification-service
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/4
      RABBITMQ_URL: amqp://clinical:${RABBITMQ_PASSWORD}@rabbitmq:5672/
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
    ports:
      - "8004:8004"
    depends_on:
      - postgres-master
      - redis
      - rabbitmq
    networks:
      - clinical-network
    volumes:
      - ./backend/notification-service:/app
    restart: unless-stopped

  # Reporting Service
  reporting-service:
    build:
      context: ./backend/reporting-service
      dockerfile: Dockerfile
    container_name: clinical-reporting-service
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/5
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ROOT_USER}
      MINIO_SECRET_KEY: ${MINIO_ROOT_PASSWORD}
    ports:
      - "8005:8005"
    depends_on:
      - postgres-master
      - redis
      - minio
    networks:
      - clinical-network
    volumes:
      - ./backend/reporting-service:/app
    restart: unless-stopped

  # Audit Service
  audit-service:
    build:
      context: ./backend/audit-service
      dockerfile: Dockerfile
    container_name: clinical-audit-service
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/6
    ports:
      - "8006:8006"
    depends_on:
      - postgres-master
      - redis
    networks:
      - clinical-network
    volumes:
      - ./backend/audit-service:/app
    restart: unless-stopped

  # Celery Worker
  celery-worker:
    build:
      context: ./backend/notification-service
      dockerfile: Dockerfile
    container_name: clinical-celery-worker
    command: celery -A app.celery worker --loglevel=info
    environment:
      DATABASE_URL: postgresql+asyncpg://clinical_admin:${POSTGRES_PASSWORD}@postgres-master:5432/clinical_storage
      REDIS_URL: redis://redis:6379/4
      RABBITMQ_URL: amqp://clinical:${RABBITMQ_PASSWORD}@rabbitmq:5672/
    depends_on:
      - postgres-master
      - redis
      - rabbitmq
    networks:
      - clinical-network
    volumes:
      - ./backend/notification-service:/app
    restart: unless-stopped

  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: clinical-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://nginx/api/v1
      NEXT_PUBLIC_WS_URL: ws://nginx/ws
    ports:
      - "3000:3000"
    depends_on:
      - auth-service
      - core-api
    networks:
      - clinical-network
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    restart: unless-stopped

  # Nginx (Reverse Proxy)
  nginx:
    image: nginx:alpine
    container_name: clinical-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - auth-service
      - core-api
      - rfid-service
      - workflow-engine
      - notification-service
      - reporting-service
      - audit-service
    networks:
      - clinical-network
    restart: unless-stopped

networks:
  clinical-network:
    driver: bridge

volumes:
  postgres_master_data:
  postgres_replica_data:
  redis_data:
  rabbitmq_data:
  minio_data:
```

**.env.example:**
```bash
# PostgreSQL
POSTGRES_PASSWORD=your_secure_postgres_password

# Redis (pas de password en dev)

# RabbitMQ
RABBITMQ_PASSWORD=your_secure_rabbitmq_password

# MinIO
MINIO_ROOT_USER=clinical_minio_admin
MINIO_ROOT_PASSWORD=your_secure_minio_password

# JWT
JWT_SECRET_KEY=your_secure_jwt_secret_key_minimum_32_chars
JWT_ALGORITHM=RS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_email_password

# Application
APP_NAME=Clinical Storage System
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=True

# Frontend
NEXT_PUBLIC_API_URL=http://localhost/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost/ws
```

---

### 1.3 Commandes Utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f [service_name]

# Arrêter tous les services
docker-compose down

# Rebuild un service
docker-compose up -d --build [service_name]

# Exécuter migrations BDD
docker-compose exec core-api alembic upgrade head

# Accéder au shell PostgreSQL
docker-compose exec postgres-master psql -U clinical_admin -d clinical_storage

# Accéder au shell Redis
docker-compose exec redis redis-cli

# Tests backend
docker-compose exec core-api pytest

# Tests frontend
docker-compose exec frontend npm test
```

---

## 2. STRUCTURE DES RÉPERTOIRES

```
clinical-storage-system/
├── backend/
│   ├── auth-service/
│   │   ├── app/
│   │   │   ├── __init__.py
│   │   │   ├── main.py
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── dependencies.py
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   ├── core-api/
│   ├── rfid-service/
│   ├── workflow-engine/
│   ├── notification-service/
│   ├── reporting-service/
│   └── audit-service/
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── studies/
│   │   │   ├── storage/
│   │   │   ├── access-requests/
│   │   │   ├── reports/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   ├── tables/
│   │   └── layout/
│   ├── lib/
│   │   ├── api/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── utils/
│   │   └── db/  # IndexedDB pour offline
│   ├── public/
│   ├── styles/
│   ├── package.json
│   └── tsconfig.json
├── database/
│   ├── migrations/
│   ├── seeds/
│   ├── init/
│   └── scripts/
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── docs/
│   ├── architecture/
│   ├── api/
│   └── user-guides/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 3. BONNES PRATIQUES DÉVELOPPEMENT

### 3.1 Code Backend (Python/FastAPI)

#### Structure Modèle (SQLAlchemy)

```python
# app/models/document.py
from sqlalchemy import Column, String, Integer, Date, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.database import Base

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Relations
    stored_item_id = Column(UUID(as_uuid=True), ForeignKey("stored_items.id", ondelete="CASCADE"))
    
    # Champs spécifiques
    document_type = Column(String(100), nullable=False, index=True)
    subject_id = Column(String(100), index=True)
    visit_number = Column(String(50))
    form_name = Column(String(255))
    version = Column(String(50))
    page_count = Column(Integer)
    original_language = Column(String(10))
    signature_required = Column(Boolean, default=False)
    signed_date = Column(Date)
    confidentiality_level = Column(String(50), default='HIGH')
    retention_category = Column(String(100))
    metadata = Column(JSONB)
    
    # Relation vers stored_item parent
    stored_item = relationship("StoredItem", back_populates="document")
    
    def __repr__(self):
        return f"<Document(id={self.id}, type={self.document_type}, subject={self.subject_id})>"
```

---

#### Structure Schema (Pydantic)

```python
# app/schemas/document.py
from pydantic import BaseModel, Field, UUID4
from typing import Optional
from datetime import date, datetime

class DocumentBase(BaseModel):
    document_type: str = Field(..., max_length=100)
    subject_id: Optional[str] = Field(None, max_length=100)
    visit_number: Optional[str] = Field(None, max_length=50)
    form_name: Optional[str] = Field(None, max_length=255)
    version: Optional[str] = Field(None, max_length=50)
    page_count: Optional[int] = None
    signature_required: bool = False
    signed_date: Optional[date] = None
    confidentiality_level: str = Field(default='HIGH', max_length=50)

class DocumentCreate(DocumentBase):
    study_id: UUID4
    site_id: UUID4
    container_id: Optional[UUID4] = None
    internal_code: Optional[str] = None
    description: Optional[str] = None
    storage_date: date
    expected_retention_until: Optional[date] = None

class DocumentUpdate(BaseModel):
    container_id: Optional[UUID4] = None
    physical_condition: Optional[str] = None
    location_notes: Optional[str] = None
    # Ajouter autres champs modifiables

class DocumentResponse(DocumentBase):
    id: UUID4
    stored_item_id: UUID4
    created_at: datetime
    updated_at: datetime
    
    # Relations imbriquées
    study: Optional["StudyResponse"] = None
    site: Optional["SiteResponse"] = None
    container: Optional["ContainerResponse"] = None
    
    class Config:
        from_attributes = True  # Pydantic v2
```

---

#### Structure Route (FastAPI)

```python
# app/routes/documents.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentResponse
from app.services.document_service import DocumentService
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/", response_model=List[DocumentResponse])
async def get_documents(
    study_id: Optional[UUID] = Query(None),
    site_id: Optional[UUID] = Query(None),
    document_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer liste de documents avec filtres et pagination.
    """
    service = DocumentService(db)
    
    documents = await service.get_documents(
        study_id=study_id,
        site_id=site_id,
        document_type=document_type,
        status=status,
        search=search,
        page=page,
        page_size=page_size,
        user=current_user
    )
    
    return documents

@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document_data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enregistrer nouveau document.
    """
    service = DocumentService(db)
    
    # Vérifier permissions
    if not current_user.has_permission("documents", "create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    document = await service.create_document(document_data, current_user)
    
    return document

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer détails d'un document.
    """
    service = DocumentService(db)
    
    document = await service.get_document_by_id(document_id, current_user)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return document

@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: UUID,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mettre à jour document.
    """
    service = DocumentService(db)
    
    if not current_user.has_permission("documents", "update"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    document = await service.update_document(document_id, document_data, current_user)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return document
```

---

#### Structure Service (Business Logic)

```python
# app/services/document_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional
from uuid import UUID

from app.models.document import Document
from app.models.stored_item import StoredItem
from app.schemas.document import DocumentCreate, DocumentUpdate
from app.models.user import User
from app.services.audit_service import AuditService

class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_service = AuditService(db)
    
    async def get_documents(
        self,
        study_id: Optional[UUID] = None,
        site_id: Optional[UUID] = None,
        document_type: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
        user: User = None
    ) -> List[Document]:
        """
        Récupérer documents avec filtres.
        """
        query = select(Document).join(StoredItem)
        
        # Filtres
        filters = []
        if study_id:
            filters.append(StoredItem.study_id == study_id)
        if site_id:
            filters.append(StoredItem.site_id == site_id)
        if document_type:
            filters.append(Document.document_type == document_type)
        if status:
            filters.append(StoredItem.status == status)
        if search:
            filters.append(
                or_(
                    StoredItem.description.ilike(f"%{search}%"),
                    Document.subject_id.ilike(f"%{search}%"),
                    StoredItem.internal_code.ilike(f"%{search}%")
                )
            )
        
        if filters:
            query = query.where(and_(*filters))
        
        # Permissions utilisateur (RLS)
        if not user.is_superuser:
            user_site_ids = [site.id for site in user.sites]
            query = query.where(StoredItem.site_id.in_(user_site_ids))
        
        # Pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size)
        
        result = await self.db.execute(query)
        documents = result.scalars().all()
        
        return documents
    
    async def create_document(
        self,
        document_data: DocumentCreate,
        user: User
    ) -> Document:
        """
        Créer nouveau document.
        """
        # Créer stored_item parent
        stored_item = StoredItem(
            study_id=document_data.study_id,
            site_id=document_data.site_id,
            container_id=document_data.container_id,
            item_type='DOCUMENT',
            internal_code=document_data.internal_code,
            description=document_data.description,
            storage_date=document_data.storage_date,
            expected_retention_until=document_data.expected_retention_until,
            status='IN_STORAGE',
            created_by=user.id
        )
        self.db.add(stored_item)
        await self.db.flush()
        
        # Créer document
        document = Document(
            id=stored_item.id,
            document_type=document_data.document_type,
            subject_id=document_data.subject_id,
            visit_number=document_data.visit_number,
            form_name=document_data.form_name,
            version=document_data.version,
            page_count=document_data.page_count,
            signature_required=document_data.signature_required,
            signed_date=document_data.signed_date,
            confidentiality_level=document_data.confidentiality_level
        )
        self.db.add(document)
        
        # Audit trail
        await self.audit_service.log_action(
            event_type='CREATE',
            table_name='documents',
            record_id=document.id,
            user_id=user.id,
            new_values=document_data.dict()
        )
        
        await self.db.commit()
        await self.db.refresh(document)
        
        return document
    
    async def get_document_by_id(
        self,
        document_id: UUID,
        user: User
    ) -> Optional[Document]:
        """
        Récupérer document par ID.
        """
        query = select(Document).where(Document.id == document_id)
        result = await self.db.execute(query)
        document = result.scalar_one_or_none()
        
        # Vérifier permissions
        if document and not user.is_superuser:
            if document.stored_item.site_id not in [s.id for s in user.sites]:
                return None
        
        return document
    
    async def update_document(
        self,
        document_id: UUID,
        document_data: DocumentUpdate,
        user: User
    ) -> Optional[Document]:
        """
        Mettre à jour document.
        """
        document = await self.get_document_by_id(document_id, user)
        
        if not document:
            return None
        
        # Sauvegarder anciennes valeurs
        old_values = {
            "container_id": document.stored_item.container_id,
            "physical_condition": document.stored_item.physical_condition,
            "location_notes": document.stored_item.location_notes
        }
        
        # Mettre à jour
        update_data = document_data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(document.stored_item, key):
                setattr(document.stored_item, key, value)
        
        document.stored_item.updated_by = user.id
        
        # Audit trail
        await self.audit_service.log_action(
            event_type='UPDATE',
            table_name='documents',
            record_id=document.id,
            user_id=user.id,
            old_values=old_values,
            new_values=update_data
        )
        
        await self.db.commit()
        await self.db.refresh(document)
        
        return document
```

---

### 3.2 Code Frontend (React/Next.js)

#### API Client (Axios)

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token } = response.data.data;
        localStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Rediriger vers login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

---

#### Service API (Documents)

```typescript
// lib/api/documents.ts
import apiClient from './client';
import { Document, DocumentCreate, DocumentUpdate } from '@/types/document';

export const documentsApi = {
  getDocuments: async (params?: {
    study_id?: string;
    site_id?: string;
    document_type?: string;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const response = await apiClient.get<{ data: { items: Document[] } }>(
      '/documents',
      { params }
    );
    return response.data.data.items;
  },

  getDocument: async (id: string) => {
    const response = await apiClient.get<{ data: Document }>(`/documents/${id}`);
    return response.data.data;
  },

  createDocument: async (data: DocumentCreate) => {
    const response = await apiClient.post<{ data: Document }>(
      '/documents',
      data
    );
    return response.data.data;
  },

  updateDocument: async (id: string, data: DocumentUpdate) => {
    const response = await apiClient.put<{ data: Document }>(
      `/documents/${id}`,
      data
    );
    return response.data.data;
  },
};
```

---

#### Hook React Query

```typescript
// lib/hooks/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { DocumentCreate, DocumentUpdate } from '@/types/document';
import { toast } from '@/components/ui/use-toast';

export const useDocuments = (params?: any) => {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.getDocuments(params),
  });
};

export const useDocument = (id: string) => {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => documentsApi.getDocument(id),
    enabled: !!id,
  });
};

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DocumentCreate) => documentsApi.createDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: 'Success',
        description: 'Document created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to create document',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DocumentUpdate }) =>
      documentsApi.updateDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.id] });
      toast({
        title: 'Success',
        description: 'Document updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update document',
        variant: 'destructive',
      });
    },
  });
};
```

---

#### Composant Table Documents

```typescript
// components/documents/DocumentsTable.tsx
'use client';

import { useState } from 'react';
import { useDocuments } from '@/lib/hooks/useDocuments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

export function DocumentsTable() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: documents, isLoading, error } = useDocuments({
    search,
    page,
    page_size: 50,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading documents</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Subject ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Storage Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents?.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>{doc.document_type}</TableCell>
              <TableCell>{doc.subject_id}</TableCell>
              <TableCell>{doc.description}</TableCell>
              <TableCell>{doc.site?.name}</TableCell>
              <TableCell>{doc.status}</TableCell>
              <TableCell>{new Date(doc.storage_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
```

---

## 4. TESTS

### 4.1 Tests Backend (Pytest)

```python
# tests/test_documents.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.document import Document
from tests.utils import create_test_user, create_test_study, create_test_site

@pytest.mark.asyncio
async def test_create_document(client: AsyncClient, db: AsyncSession):
    # Créer données de test
    user = await create_test_user(db)
    study = await create_test_study(db)
    site = await create_test_site(db, study.id)
    
    # Login
    login_response = await client.post("/auth/login", json={
        "username": user.username,
        "password": "test_password"
    })
    token = login_response.json()["data"]["access_token"]
    
    # Créer document
    document_data = {
        "study_id": str(study.id),
        "site_id": str(site.id),
        "document_type": "CONSENT",
        "subject_id": "SUBJ-001",
        "storage_date": "2026-02-03"
    }
    
    response = await client.post(
        "/documents",
        json=document_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    assert response.json()["data"]["document_type"] == "CONSENT"

@pytest.mark.asyncio
async def test_get_documents(client: AsyncClient, db: AsyncSession):
    user = await create_test_user(db)
    # ... créer quelques documents de test
    
    # Login
    login_response = await client.post("/auth/login", json={
        "username": user.username,
        "password": "test_password"
    })
    token = login_response.json()["data"]["access_token"]
    
    # Récupérer documents
    response = await client.get(
        "/documents",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert len(response.json()["data"]["items"]) > 0
```

---

## 5. DÉPLOIEMENT PRODUCTION

### 5.1 Checklist Pré-Déploiement

- [ ] Tests unitaires passent (>80% coverage)
- [ ] Tests d'intégration passent
- [ ] Variables d'environnement production configurées
- [ ] Certificats SSL valides
- [ ] Backups BDD configurés
- [ ] Monitoring configuré
- [ ] Documentation à jour
- [ ] Formation utilisateurs effectuée
- [ ] Plan de reprise d'activité testé

### 5.2 Commandes Déploiement

```bash
# Build images production
docker-compose -f docker-compose.prod.yml build

# Démarrer services
docker-compose -f docker-compose.prod.yml up -d

# Migrations BDD
docker-compose exec core-api alembic upgrade head

# Seed data initial
docker-compose exec core-api python scripts/seed_initial_data.py

# Vérifier santé services
docker-compose ps
```

---

**Document créé le:** 2026-02-03  
**Version:** 1.0
