# Guide d'Implémentation TypeScript - Clinical Storage System

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
- mypy (type checker Python)

# Frontend
- Node.js 20.x LTS
- npm 10.x+
- TypeScript 5.3+

# Outils
- VS Code (recommandé pour TypeScript)
- pgAdmin 4 ou DBeaver
- Postman ou Insomnia
- RFID Reader (hardware - phase 3)
```

---

### 1.2 Installation Initiale

#### Backend Setup (Python avec Type Hints)

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
pip install -r requirements-dev.txt  # Type checkers

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
sqlalchemy==2.0.25
asyncpg==0.29.0
alembic==1.13.1
psycopg2-binary==2.9.9

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

# Logging & Monitoring
structlog==24.1.0
prometheus-client==0.19.0

# Testing
pytest==7.4.4
pytest-asyncio==0.23.3
pytest-cov==4.1.0
httpx==0.26.0
```

**requirements-dev.txt (Type Checking):**
```txt
# Type Checking
mypy==1.8.0
types-redis==4.6.0
types-requests==2.31.0

# Linting
flake8==7.0.0
black==23.12.1
isort==5.13.2

# Testing
pytest-mock==3.12.0
faker==22.0.0
```

#### Frontend Setup (TypeScript)

```bash
cd frontend

# Initialiser avec TypeScript
npm create vite@latest . -- --template react-ts

# Installer dépendances
npm install

# Variables d'environnement
cp .env.example .env.local
```

**package.json (Frontend avec TypeScript):**
```json
{
  "name": "clinical-storage-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "@tanstack/react-query": "^5.17.19",
    "zustand": "^4.4.7",
    "axios": "^1.6.5",
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.307.0",
    "date-fns": "^3.0.6",
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/node": "^20.11.5",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11",
    "vite-plugin-pwa": "^0.17.4",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.2.0",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^23.2.0"
  }
}
```

---

### 1.3 Configuration TypeScript

#### Frontend tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### tsconfig.node.json

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

#### Backend mypy.ini

```ini
[mypy]
python_version = 3.11
warn_return_any = True
warn_unused_configs = True
disallow_untyped_defs = True
disallow_any_unimported = False
no_implicit_optional = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_no_return = True
check_untyped_defs = True
strict_equality = True

[mypy-tests.*]
disallow_untyped_defs = False

[mypy-alembic.*]
ignore_errors = True

[mypy-celery.*]
ignore_missing_imports = True

[mypy-redis.*]
ignore_missing_imports = True
```

---

## 2. STRUCTURE DE PROJET TYPESCRIPT

### 2.1 Backend (Python avec Type Hints Stricts)

```
backend/
├── common/
│   ├── __init__.py
│   ├── py.typed                    # PEP 561 marker
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                 # Type hints SQLAlchemy
│   │   ├── user.py
│   │   └── ...
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── base.py                 # Pydantic avec generics
│   │   ├── user.py
│   │   └── ...
│   ├── types/                      # Type aliases & protocols
│   │   ├── __init__.py
│   │   ├── api.py                  # API types
│   │   ├── database.py             # DB types
│   │   └── auth.py                 # Auth types
│   └── ...
├── core-api/
│   ├── app/
│   │   ├── main.py
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/                  # Service-specific types
│   └── ...
└── ...
```

### 2.2 Frontend (TypeScript)

```
clinical-storage-frontend/
├── src/
│   ├── main.tsx                    # .tsx pour JSX
│   ├── App.tsx
│   ├── router.tsx
│   │
│   ├── types/                      # Type definitions
│   │   ├── index.ts               # Re-exports
│   │   ├── api.ts                 # API types
│   │   ├── models.ts              # Domain models
│   │   ├── components.ts          # Component props
│   │   ├── hooks.ts               # Hook return types
│   │   └── stores.ts              # Store types
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.types.ts    # Props types
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   └── features/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useDocuments.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── types.ts           # API client types
│   │   │   ├── auth.ts
│   │   │   └── ...
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── types.ts           # IndexedDB types
│   │   └── utils/
│   │       ├── validators.ts
│   │       └── types.ts           # Utility types
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── types.ts               # Store types
│   │   └── ...
│   │
│   └── vite-env.d.ts              # Vite types
│
├── tsconfig.json
├── tsconfig.node.json
└── ...
```

---

## 3. TYPES ET INTERFACES

### 3.1 Backend Python Type Hints

**common/types/api.py**
```python
from typing import TypeVar, Generic, Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

T = TypeVar('T')

class PaginationParams(BaseModel):
    """Paramètres de pagination."""
    page: int = 1
    page_size: int = 50

class PaginationMeta(BaseModel):
    """Métadonnées de pagination."""
    current_page: int
    page_size: int
    total_items: int
    total_pages: int
    has_next: bool
    has_previous: bool

class APIResponse(BaseModel, Generic[T]):
    """Réponse API standardisée."""
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    timestamp: datetime

class PaginatedResponse(BaseModel, Generic[T]):
    """Réponse paginée."""
    items: List[T]
    pagination: PaginationMeta

class ErrorDetail(BaseModel):
    """Détail d'une erreur."""
    code: str
    message: str
    field: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    """Réponse d'erreur."""
    success: bool = False
    error: ErrorDetail
    timestamp: datetime
```

**common/models/base.py**
```python
from typing import Optional, Any
from datetime import datetime
from sqlalchemy import Column, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import uuid

class Base(DeclarativeBase):
    """Base model avec types."""
    pass

class BaseModel(Base):
    """Modèle de base avec timestamps."""
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
```

**Example Service avec Type Hints**
```python
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentUpdate
from common.types.api import PaginatedResponse, PaginationParams

class DocumentService:
    """Service de gestion des documents avec types stricts."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_documents(
        self,
        *,
        pagination: PaginationParams,
        filters: Optional[Dict[str, Any]] = None
    ) -> PaginatedResponse[Document]:
        """
        Récupère la liste des documents.

        Args:
            pagination: Paramètres de pagination
            filters: Filtres optionnels

        Returns:
            Liste paginée de documents

        Raises:
            ValueError: Si les paramètres sont invalides
        """
        query = select(Document).where(Document.is_deleted == False)

        if filters:
            if study_id := filters.get('study_id'):
                query = query.where(Document.study_id == study_id)
            if site_id := filters.get('site_id'):
                query = query.where(Document.site_id == site_id)

        # Count total
        total_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total_items = total_result.scalar_one()

        # Paginate
        offset = (pagination.page - 1) * pagination.page_size
        query = query.offset(offset).limit(pagination.page_size)

        result = await self.db.execute(query)
        items = result.scalars().all()

        return PaginatedResponse(
            items=items,
            pagination=PaginationMeta(
                current_page=pagination.page,
                page_size=pagination.page_size,
                total_items=total_items,
                total_pages=(total_items + pagination.page_size - 1) // pagination.page_size,
                has_next=pagination.page * pagination.page_size < total_items,
                has_previous=pagination.page > 1
            )
        )

    async def get_document_by_id(
        self,
        document_id: UUID
    ) -> Optional[Document]:
        """
        Récupère un document par ID.

        Args:
            document_id: UUID du document

        Returns:
            Document ou None si non trouvé
        """
        query = select(Document).where(
            Document.id == document_id,
            Document.is_deleted == False
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_document(
        self,
        data: DocumentCreate,
        user_id: UUID
    ) -> Document:
        """
        Crée un nouveau document.

        Args:
            data: Données du document
            user_id: ID de l'utilisateur créateur

        Returns:
            Document créé

        Raises:
            ValueError: Si les données sont invalides
        """
        document = Document(
            **data.model_dump(),
            created_by=user_id
        )
        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        return document
```

### 3.2 Frontend TypeScript Types

**src/types/models.ts**
```typescript
// Base types
export type UUID = string;

export interface Timestamps {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// User types
export enum UserRole {
  ADMIN = 'ADMIN',
  INVESTIGATOR = 'INVESTIGATOR',
  ARC = 'ARC',
  MONITOR = 'MONITOR',
  ARCHIVIST = 'ARCHIVIST',
  DATA_MANAGER = 'DATA_MANAGER',
  DATA_CLERK = 'DATA_CLERK',
}

export interface Role {
  id: UUID;
  code: UserRole;
  name: string;
  description: string;
  permissions: Record<string, Record<string, boolean>>;
}

export interface User extends Timestamps {
  id: UUID;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  roles: Role[];
  sites: Site[];
}

// Document types
export enum DocumentType {
  CONSENT = 'CONSENT',
  CRF = 'CRF',
  SOURCE_DOC = 'SOURCE_DOC',
  LAB_RESULT = 'LAB_RESULT',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  IN_STORAGE = 'IN_STORAGE',
  OUT = 'OUT',
  ARCHIVED = 'ARCHIVED',
}

export interface Document extends Timestamps {
  id: UUID;
  document_type: DocumentType;
  subject_id: string;
  description: string;
  study_id: UUID;
  site_id: UUID;
  storage_location_id: UUID;
  container_id: UUID | null;
  rfid_tag_id: UUID | null;
  status: DocumentStatus;
  study: Study;
  site: Site;
  storage_location: StorageLocation;
  container: Container | null;
  rfid_tag: RFIDTag | null;
}

// Equipment types
export enum EquipmentType {
  ANALYZER = 'ANALYZER',
  CENTRIFUGE = 'CENTRIFUGE',
  REFRIGERATOR = 'REFRIGERATOR',
  FREEZER = 'FREEZER',
  INCUBATOR = 'INCUBATOR',
  OTHER = 'OTHER',
}

export interface Equipment extends Timestamps {
  id: UUID;
  equipment_type: EquipmentType;
  manufacturer: string;
  model: string;
  serial_number: string;
  site_id: UUID;
  storage_location_id: UUID;
  calibration_required: boolean;
  last_calibration_date: string | null;
  next_calibration_date: string | null;
  operational_status: 'OPERATIONAL' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  site: Site;
}

// Access Request types
export enum AccessRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FULFILLED = 'FULFILLED',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE',
}

export enum AccessRequestType {
  CONSULTATION = 'CONSULTATION',
  COPY = 'COPY',
  LOAN = 'LOAN',
}

export interface AccessRequest extends Timestamps {
  id: UUID;
  request_number: string;
  item_id: UUID;
  item_type: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';
  request_type: AccessRequestType;
  requester_id: UUID;
  approver_id: UUID | null;
  status: AccessRequestStatus;
  reason: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  due_date: string;
  actual_return_date: string | null;
  extension_requested: boolean;
  extension_approved: boolean;
  requester: User;
  approver: User | null;
}

// Study & Site types
export interface Study {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

export interface Site {
  id: UUID;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Storage types
export interface StorageLocation {
  id: UUID;
  name: string;
  location_type: string;
  site_id: UUID;
  parent_location_id: UUID | null;
  capacity: number | null;
  current_count: number;
  site: Site;
}

export interface Container {
  id: UUID;
  name: string;
  container_type: string;
  storage_location_id: UUID;
  capacity: number;
  current_count: number;
}

// RFID types
export interface RFIDTag {
  id: UUID;
  epc: string;
  item_id: UUID;
  item_type: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE';
  encoded_at: string;
  last_read_at: string | null;
}
```

**src/types/api.ts**
```typescript
// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface ErrorDetail {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: ErrorDetail;
  timestamp: string;
}

// Filter types
export interface DocumentFilters {
  search?: string;
  study_id?: UUID;
  site_id?: UUID;
  document_type?: DocumentType;
  status?: DocumentStatus;
  page?: number;
  page_size?: number;
}

export interface EquipmentFilters {
  search?: string;
  site_id?: UUID;
  equipment_type?: EquipmentType;
  operational_status?: string;
  calibration_due?: boolean;
  page?: number;
  page_size?: number;
}

// Create/Update types
export interface DocumentCreate {
  document_type: DocumentType;
  subject_id: string;
  description: string;
  study_id: UUID;
  site_id: UUID;
  storage_location_id: UUID;
  container_id?: UUID;
}

export interface DocumentUpdate {
  document_type?: DocumentType;
  subject_id?: string;
  description?: string;
  storage_location_id?: UUID;
  container_id?: UUID;
}

export interface EquipmentCreate {
  equipment_type: EquipmentType;
  manufacturer: string;
  model: string;
  serial_number: string;
  site_id: UUID;
  storage_location_id: UUID;
  calibration_required: boolean;
  next_calibration_date?: string;
}
```

**src/types/components.ts**
```typescript
import { ReactNode, ButtonHTMLAttributes } from 'react';

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Input types
export type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  variant?: InputVariant;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (item: T) => ReactNode;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  onSort?: (key: keyof T) => void;
  sortKey?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

// Modal types
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
}
```

**src/types/hooks.ts**
```typescript
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { AxiosError } from 'axios';

// Query result types
export type QueryResult<T> = UseQueryResult<T, AxiosError>;
export type MutationResult<TData, TVariables> = UseMutationResult<
  TData,
  AxiosError,
  TVariables
>;

// Hook return types
export interface UseDocumentsResult {
  documents: Document[] | undefined;
  isLoading: boolean;
  error: AxiosError | null;
  refetch: () => void;
}

export interface UseCreateDocumentResult {
  createDocument: (data: DocumentCreate) => Promise<void>;
  isLoading: boolean;
  error: AxiosError | null;
}

export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export interface UseWebSocketResult {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: WebSocketMessage) => void;
}
```

**src/types/stores.ts**
```typescript
// Auth store types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleCode: UserRole) => boolean;
  hasAnyRole: (roleCodes: UserRole[]) => boolean;
}

export type AuthStore = AuthState & AuthActions;

// UI store types
export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  globalLoading: boolean;
  modals: Record<string, boolean>;
  notifications: Notification[];
}

export interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setGlobalLoading: (loading: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export type UIStore = UIState & UIActions;

// Offline store types
export interface PendingAction {
  id: string;
  type: string;
  action: string;
  data: unknown;
  timestamp: string;
  retries: number;
}

export interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];
  syncInProgress: boolean;
  lastSyncTimestamp: string | null;
}

export interface OfflineActions {
  setOnlineStatus: (status: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp' | 'retries'>) => void;
  removePendingAction: (actionId: string) => void;
  updatePendingAction: (actionId: string, updates: Partial<PendingAction>) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  clearPendingActions: () => void;
  setLastSyncTimestamp: (timestamp: string) => void;
  getPendingActionsCount: () => number;
  hasPendingActions: () => boolean;
}

export type OfflineStore = OfflineState & OfflineActions;
```

---

## 4. EXEMPLES D'IMPLÉMENTATION TYPESCRIPT

### 4.1 API Client Typé

**src/lib/api/documents.ts**
```typescript
import { apiClient } from './client';
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentFilters,
  PaginatedResponse,
  APIResponse
} from '@/types';

export const documentsApi = {
  /**
   * Récupère la liste des documents
   */
  getDocuments: async (
    filters: DocumentFilters = {}
  ): Promise<PaginatedResponse<Document>> => {
    const response = await apiClient.get<APIResponse<PaginatedResponse<Document>>>(
      '/documents',
      { params: filters }
    );
    return response.data.data!;
  },

  /**
   * Récupère un document par ID
   */
  getDocumentById: async (id: string): Promise<Document> => {
    const response = await apiClient.get<APIResponse<Document>>(`/documents/${id}`);
    return response.data.data!;
  },

  /**
   * Crée un nouveau document
   */
  createDocument: async (data: DocumentCreate): Promise<Document> => {
    const response = await apiClient.post<APIResponse<Document>>('/documents', data);
    return response.data.data!;
  },

  /**
   * Met à jour un document
   */
  updateDocument: async (id: string, data: DocumentUpdate): Promise<Document> => {
    const response = await apiClient.put<APIResponse<Document>>(
      `/documents/${id}`,
      data
    );
    return response.data.data!;
  },

  /**
   * Supprime un document (soft delete)
   */
  deleteDocument: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};

export default documentsApi;
```

### 4.2 Custom Hook Typé

**src/hooks/useDocuments.ts**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { toast } from '@/components/ui/Toast';
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentFilters,
  PaginatedResponse
} from '@/types';
import type { AxiosError } from 'axios';

export function useDocuments(filters: DocumentFilters = {}) {
  return useQuery<PaginatedResponse<Document>, AxiosError>({
    queryKey: ['documents', filters],
    queryFn: () => documentsApi.getDocuments(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useDocumentById(id: string) {
  return useQuery<Document, AxiosError>({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getDocumentById(id),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation<Document, AxiosError, DocumentCreate>({
    mutationFn: documentsApi.createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document créé avec succès');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation<Document, AxiosError, { id: string; data: DocumentUpdate }>({
    mutationFn: ({ id, data }) => documentsApi.updateDocument(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      toast.success('Document mis à jour');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError, string>({
    mutationFn: documentsApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document supprimé');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Erreur lors de la suppression';
      toast.error(message);
    },
  });
}
```

### 4.3 Composant Typé

**src/components/ui/Button.tsx**
```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types/components';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      disabled = false,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {icon && iconPosition === 'left' && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && !loading && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

### 4.4 Store Typé

**src/store/authStore.ts**
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, User, UserRole } from '@/types';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Actions
      setAuth: (user: User, accessToken: string, refreshToken: string) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setAccessToken: (accessToken: string) => {
        set({ accessToken });
      },

      setUser: (user: User) => {
        set({ user });
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('auth-storage');
      },

      hasPermission: (resource: string, action: string): boolean => {
        const { user } = get();
        if (!user) return false;

        // Admin has all permissions
        if (user.roles.some((role) => role.code === 'ADMIN')) {
          return true;
        }

        // Check specific permission
        return user.roles.some(
          (role) => role.permissions[resource]?.[action] === true
        );
      },

      hasRole: (roleCode: UserRole): boolean => {
        const { user } = get();
        if (!user) return false;

        return user.roles.some((role) => role.code === roleCode);
      },

      hasAnyRole: (roleCodes: UserRole[]): boolean => {
        const { user } = get();
        if (!user) return false;

        return user.roles.some((role) => roleCodes.includes(role.code));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
```

---

## 5. COMMANDES DE DÉVELOPPEMENT

### 5.1 Backend (Python)

```bash
# Type checking avec mypy
mypy backend/

# Lint avec flake8
flake8 backend/

# Format avec black
black backend/

# Sort imports
isort backend/

# Run all checks
make type-check  # mypy
make lint        # flake8
make format      # black + isort

# Tests
pytest --cov=app --cov-report=html
```

### 5.2 Frontend (TypeScript)

```bash
# Type checking
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Build (vérifie les types)
npm run build

# Tests
npm run test
npm run test:coverage

# Dev (avec type checking en temps réel)
npm run dev
```

---

## 6. CONFIGURATION IDE

### 6.1 VS Code settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "python.formatting.provider": "black"
}
```

### 6.2 Extensions Recommandées

**Frontend:**
- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- Error Lens

**Backend:**
- Python
- Pylance
- Black Formatter
- autoDocstring
- mypy

---

## 7. CI/CD AVEC TYPE CHECKING

### 7.1 GitHub Actions

```yaml
name: Type Check & Tests

on: [push, pull_request]

jobs:
  backend-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - run: mypy backend/
      - run: flake8 backend/
      - run: pytest --cov=app

  frontend-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 8. AVANTAGES TYPESCRIPT

### 8.1 Backend Python

✅ **Type Safety** - Détection erreurs à la compilation  
✅ **IDE Support** - Autocomplétion intelligente  
✅ **Documentation** - Types = documentation vivante  
✅ **Refactoring** - Renommage sûr  
✅ **Moins de bugs** - Catch erreurs avant runtime  

### 8.2 Frontend TypeScript

✅ **Type Safety** - Props validation automatique  
✅ **IntelliSense** - Autocomplétion parfaite  
✅ **Refactoring** - Modifications sûres  
✅ **API Contract** - Types partagés backend/frontend  
✅ **Moins de tests** - Types remplacent certains tests  

---

## 9. BEST PRACTICES

### 9.1 Python Type Hints

```python
# ✅ BON
async def get_user(user_id: UUID) -> Optional[User]:
    """Récupère un utilisateur."""
    return await db.get(User, user_id)

# ❌ MAUVAIS
async def get_user(user_id):
    return await db.get(User, user_id)
```

### 9.2 TypeScript

```typescript
// ✅ BON
interface Props {
  title: string;
  count: number;
  onSubmit: (value: string) => void;
}

export function Component({ title, count, onSubmit }: Props) {
  // ...
}

// ❌ MAUVAIS
export function Component({ title, count, onSubmit }) {
  // ...
}
```

---

**L'utilisation de TypeScript (frontend) et Type Hints stricts (backend) garantit un code plus robuste, maintenable et autodocumenté !** 🎯
