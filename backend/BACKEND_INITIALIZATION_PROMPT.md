# 🚀 Prompt pour Initialiser Tous les Microservices Backend

## Prompt Principal pour Claude Code

```markdown
# MISSION : Initialiser l'Architecture Backend Complète - Clinical Storage System

## Contexte
Je veux créer l'architecture backend complète du Clinical Storage System avec 7 microservices Python/FastAPI.

**Avant de commencer, lis attentivement ces documents :**
1. `/docs/ARCHITECTURE_GLOBALE.md` - Section Backend Architecture
2. `/docs/DATABASE_SCHEMA.md` - Schéma complet de la base de données
3. `/docs/API_SPECIFICATIONS.md` - Spécifications de tous les endpoints
4. `/docs/IMPLEMENTATION_GUIDE.md` - Guide d'implémentation backend

## Architecture à Créer

### Structure des Répertoires
```
backend/
├── common/                          # Code partagé entre microservices
│   ├── __init__.py
│   ├── models/                     # Modèles SQLAlchemy partagés
│   │   ├── __init__.py
│   │   ├── base.py                 # Base model avec timestamps
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── study.py
│   │   ├── site.py
│   │   ├── stored_item.py          # Table mère polymorphique
│   │   ├── document.py
│   │   ├── equipment.py
│   │   ├── consumable.py
│   │   ├── storage_location.py
│   │   ├── container.py
│   │   ├── rfid_tag.py
│   │   ├── movement.py
│   │   ├── access_request.py
│   │   ├── notification.py
│   │   ├── audit_trail.py
│   │   ├── system_settings.py
│   │   └── sync_queue.py
│   ├── schemas/                    # Schémas Pydantic partagés
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   ├── role.py
│   │   ├── study.py
│   │   ├── site.py
│   │   ├── document.py
│   │   ├── equipment.py
│   │   ├── consumable.py
│   │   ├── storage.py
│   │   ├── rfid.py
│   │   ├── movement.py
│   │   ├── access_request.py
│   │   ├── notification.py
│   │   ├── audit.py
│   │   └── response.py             # Schémas de réponse standardisés
│   ├── database/                   # Configuration base de données
│   │   ├── __init__.py
│   │   ├── session.py              # Session async
│   │   ├── base.py                 # Déclarative base
│   │   └── init_db.py              # Initialisation DB
│   ├── auth/                       # Authentification partagée
│   │   ├── __init__.py
│   │   ├── jwt.py                  # Gestion JWT
│   │   ├── permissions.py          # RBAC
│   │   └── dependencies.py         # FastAPI dependencies
│   ├── utils/                      # Utilitaires partagés
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   ├── exceptions.py           # Custom exceptions
│   │   ├── constants.py
│   │   └── logger.py               # Configuration logging
│   ├── middleware/                 # Middleware partagé
│   │   ├── __init__.py
│   │   ├── cors.py
│   │   ├── error_handler.py
│   │   └── rate_limiter.py
│   └── config/                     # Configuration
│       ├── __init__.py
│       └── settings.py             # Pydantic settings
│
├── auth-service/                    # Service 1 : Authentification (Port 8000)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # Point d'entrée FastAPI
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── auth.py             # Routes : login, refresh, logout, me, change-password
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py     # Business logic authentification
│   │   │   └── token_service.py    # Gestion tokens JWT
│   │   └── dependencies.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   └── test_auth.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── core-api/                        # Service 2 : API Principale (Port 8001)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── studies.py          # CRUD études
│   │   │   ├── sites.py            # CRUD sites
│   │   │   ├── documents.py        # CRUD documents
│   │   │   ├── equipment.py        # CRUD équipements
│   │   │   ├── consumables.py      # CRUD consommables
│   │   │   ├── storage.py          # Localisations & conteneurs
│   │   │   ├── users.py            # Gestion utilisateurs
│   │   │   └── search.py           # Recherche globale
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── document_service.py
│   │   │   ├── equipment_service.py
│   │   │   ├── consumable_service.py
│   │   │   ├── storage_service.py
│   │   │   ├── user_service.py
│   │   │   └── audit_service.py    # Log audit trail
│   │   └── dependencies.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   ├── test_document_service.py
│   │   │   └── test_equipment_service.py
│   │   └── integration/
│   │       └── test_api_endpoints.py
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── rfid-service/                    # Service 3 : RFID (Port 8002)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── rfid.py             # Encoder, lire, bulk-read
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── rfid_service.py     # Business logic RFID
│   │   │   └── tag_encoding.py     # Encodage EPC
│   │   └── dependencies.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── workflow-engine/                 # Service 4 : Workflow (Port 8003)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── access_requests.py  # CRUD demandes d'accès
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── workflow_service.py # State machine
│   │   │   └── approval_service.py # Logique approbation
│   │   └── dependencies.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── notification-service/            # Service 5 : Notifications (Port 8004)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── notifications.py    # Liste, mark-as-read
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── notification_service.py
│   │   │   ├── email_service.py    # Envoi emails SMTP
│   │   │   └── websocket_service.py # WebSocket temps réel
│   │   └── dependencies.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── reporting-service/               # Service 6 : Rapports (Port 8005)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── reports.py          # Génération rapports
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── report_service.py
│   │   │   ├── pdf_generator.py    # ReportLab
│   │   │   └── excel_generator.py  # OpenPyXL
│   │   └── dependencies.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── audit-service/                   # Service 7 : Audit Trail (Port 8006)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── audit.py            # Consultation audit trail
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── audit_service.py
│   │   │   └── integrity_service.py # Vérification hash chain
│   │   └── dependencies.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
│
├── database/                        # Migrations Alembic
│   ├── alembic/
│   │   ├── versions/               # Fichiers migrations
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── alembic.ini
│   └── init_database.py            # Script initialisation
│
├── scripts/                         # Scripts utilitaires
│   ├── create_admin.py             # Créer admin initial
│   ├── seed_data.py                # Données de test
│   └── check_health.py             # Health check tous services
│
├── docker-compose.yml               # Orchestration Docker
├── docker-compose.dev.yml           # Development
├── docker-compose.prod.yml          # Production
├── Makefile                         # Commandes utiles
├── .env.example                     # Template env vars
├── .gitignore
├── pytest.ini                       # Config pytest
└── README.md
```

## Tâches à Exécuter

### Phase 1 : Common Module (Fondations)

**1.1 Configuration Base**
```python
# backend/common/config/settings.py
Crée les Pydantic Settings avec :
- DATABASE_URL (PostgreSQL)
- REDIS_URL
- RABBITMQ_URL
- JWT_SECRET_KEY, JWT_ALGORITHM (RS256)
- JWT_ACCESS_TOKEN_EXPIRE_MINUTES (15)
- JWT_REFRESH_TOKEN_EXPIRE_DAYS (7)
- SMTP_* (email configuration)
- CORS_ORIGINS
- LOG_LEVEL
- ENVIRONMENT (dev, staging, prod)

Référence : IMPLEMENTATION_GUIDE.md section Configuration
```

**1.2 Base de Données**
```python
# backend/common/database/session.py
Crée async session factory avec SQLAlchemy 2.0 :
- create_async_engine avec pool configuration
- async_sessionmaker
- get_db() dependency pour FastAPI

# backend/common/database/base.py
Crée DeclarativeBase avec :
- Metadata configuré
- __tablename__ automatique
- Registry pour tous les modèles
```

**1.3 Modèles SQLAlchemy**
```python
Pour CHAQUE table dans DATABASE_SCHEMA.md, crée le modèle SQLAlchemy dans backend/common/models/ :

Ordre de création (respect des foreign keys) :
1. base.py - BaseModel avec id, created_at, updated_at, deleted_at
2. user.py - Table users
3. role.py - Table roles + permissions JSONB
4. study.py - Table studies
5. site.py - Table sites
6. storage_location.py - Table storage_locations (hiérarchie recursive)
7. container.py - Table containers
8. rfid_tag.py - Table rfid_tags
9. stored_item.py - Table stored_items (polymorphic base)
10. document.py - Table documents (joined table inheritance)
11. equipment.py - Table equipment (joined table inheritance)
12. consumable.py - Table consumables (joined table inheritance)
13. movement.py - Table movements
14. access_request.py - Table access_requests
15. notification.py - Table notifications
16. audit_trail.py - Table audit_trail (partitionné)
17. system_settings.py - Table system_settings
18. sync_queue.py - Table sync_queue

Spécifications :
- Utilise SQLAlchemy 2.0 syntax (Mapped, mapped_column)
- Type hints complets
- Relationships avec lazy='selectin' ou 'joined' approprié
- Indexes sur foreign keys et colonnes fréquemment filtrées
- Check constraints pour énumérations
- Polymorphic pour stored_items (type='joined')

Référence exacte : DATABASE_SCHEMA.md
```

**1.4 Schémas Pydantic**
```python
Pour CHAQUE modèle, crée 4 schémas dans backend/common/schemas/ :

Exemple pour Document :
1. DocumentBase - Champs communs
2. DocumentCreate - Input création (sans id, timestamps)
3. DocumentUpdate - Input mise à jour (champs optionnels)
4. DocumentResponse - Output API (avec relations, timestamps)

Utilise :
- Pydantic v2 syntax
- ConfigDict avec from_attributes=True
- Validators pour validations custom
- Field avec description pour OpenAPI

Référence : DATABASE_SCHEMA.md + API_SPECIFICATIONS.md
```

**1.5 Authentification**
```python
# backend/common/auth/jwt.py
Crée fonctions JWT :
- create_access_token(user_id, expires_delta)
- create_refresh_token(user_id)
- decode_token(token) -> TokenPayload
- verify_token(token) -> User
Utilise RS256 avec clés RSA

# backend/common/auth/permissions.py
Crée classe PermissionChecker :
- has_permission(user, resource, action) -> bool
- has_role(user, role_code) -> bool
- filter_by_user_sites(user, query) -> Query
Référence RBAC dans DATABASE_SCHEMA.md

# backend/common/auth/dependencies.py
Crée dependencies FastAPI :
- get_current_user(token: str = Depends(oauth2_scheme))
- require_permission(resource: str, action: str)
- require_role(role_code: str)
```

**1.6 Utilitaires**
```python
# backend/common/utils/exceptions.py
Crée custom exceptions :
- APIException (base)
- NotFoundException
- UnauthorizedException
- ForbiddenException
- ValidationException
- ConflictException

# backend/common/utils/logger.py
Configure structlog avec :
- JSON output
- Timestamp ISO
- Context processors
- Log rotation

# backend/common/utils/validators.py
Crée validators :
- validate_uuid(value)
- validate_date(value)
- validate_email(value)
- validate_phone(value)
- sanitize_string(value)

# backend/common/utils/constants.py
Définit enums et constantes :
- DocumentType, EquipmentType, ConsumableType
- AccessRequestStatus, AccessRequestType
- NotificationType, NotificationPriority
- UserRole
```

**1.7 Middleware**
```python
# backend/common/middleware/error_handler.py
Crée middleware gestion erreurs :
- Capture toutes exceptions
- Log avec contexte
- Retourne format JSON standardisé
- Gère HTTPException, SQLAlchemyError, ValidationError

# backend/common/middleware/cors.py
Configure CORS :
- Allowed origins depuis settings
- Credentials support
- Exposed headers

# backend/common/middleware/rate_limiter.py
Implémente rate limiting :
- Redis-based
- Par IP et/ou user
- Different limits par endpoint
```

### Phase 2 : Microservices

Pour CHAQUE service (auth, core-api, rfid, workflow, notification, reporting, audit) :

**2.1 Structure de Base**
```python
# [service]/app/main.py
Crée application FastAPI avec :
- Metadata (title, version, description)
- CORS middleware
- Error handler middleware
- Lifespan events (startup/shutdown)
- Include routers
- Health check endpoint (/health)
- OpenAPI configuration

# [service]/app/dependencies.py
Crée dependencies spécifiques au service

# [service]/Dockerfile
Multi-stage build :
- Stage 1: Builder (install deps)
- Stage 2: Runtime (copy only needed)
- Non-root user
- Health check

# [service]/requirements.txt
Liste dépendances :
- fastapi[all]>=0.109.0
- uvicorn[standard]>=0.27.0
- sqlalchemy[asyncio]>=2.0.25
- asyncpg>=0.29.0
- pydantic>=2.5.0
- pydantic-settings>=2.1.0
- python-jose[cryptography]>=3.3.0
- passlib[argon2]>=1.7.4
- redis>=5.0.1
- + spécifiques au service

# [service]/.env.example
Variables d'environnement requises
```

**2.2 Auth Service (Port 8000)**
```python
# Routes
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
PUT    /api/v1/auth/change-password
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

# Services
- auth_service.py : authenticate(username, password)
- token_service.py : generate_tokens(), validate_refresh_token()

Référence : API_SPECIFICATIONS.md section Auth
```

**2.3 Core API (Port 8001)**
```python
# Routes
GET/POST    /api/v1/studies
GET/PUT     /api/v1/studies/{id}
GET/POST    /api/v1/sites
GET/POST    /api/v1/documents
GET/PUT/DEL /api/v1/documents/{id}
GET/POST    /api/v1/equipment
GET/PUT/DEL /api/v1/equipment/{id}
GET/POST    /api/v1/consumables
GET/PUT/DEL /api/v1/consumables/{id}
GET/POST    /api/v1/storage-locations
GET/POST    /api/v1/containers
GET         /api/v1/search

# Services (un par ressource)
- document_service.py : CRUD + business logic
- equipment_service.py : CRUD + calibration alerts
- consumable_service.py : CRUD + stock management
- storage_service.py : Hierarchical locations
- audit_service.py : Log all mutations

Chaque mutation doit :
1. Vérifier permissions
2. Valider données
3. Exécuter action
4. Logger dans audit_trail
5. Envoyer notification si applicable

Référence : API_SPECIFICATIONS.md section Core API
```

**2.4 RFID Service (Port 8002)**
```python
# Routes
POST /api/v1/rfid/tags              # Encoder tag
POST /api/v1/rfid/read              # Lire tag
POST /api/v1/rfid/bulk-read         # Inventaire
GET  /api/v1/rfid/tags/{epc}        # Info tag

# Services
- rfid_service.py : Associate tag, read operations
- tag_encoding.py : Generate EPC (96 bits), encode user memory

EPC Structure (DATABASE_SCHEMA.md) :
- Header: 8 bits
- Filter: 3 bits  
- Partition: 3 bits
- Company Prefix: 20-40 bits
- Item Reference: 24-44 bits
- Serial: 36 bits

User Memory :
- Study ID: 32 bits
- Site ID: 16 bits
- Item Type: 8 bits
- Checksum: 16 bits

Référence : API_SPECIFICATIONS.md section RFID
```

**2.5 Workflow Engine (Port 8003)**
```python
# Routes
GET/POST /api/v1/access-requests
GET      /api/v1/access-requests/{id}
PUT      /api/v1/access-requests/{id}/approve
PUT      /api/v1/access-requests/{id}/reject
PUT      /api/v1/access-requests/{id}/fulfill
PUT      /api/v1/access-requests/{id}/return
PUT      /api/v1/access-requests/{id}/extend

# Services
- workflow_service.py : State machine
- approval_service.py : Approval logic

States : PENDING → APPROVED/REJECTED → FULFILLED → RETURNED
Transitions avec validations
Auto-alerts pour retards

Référence : ARCHITECTURE_GLOBALE.md section Workflow
```

**2.6 Notification Service (Port 8004)**
```python
# Routes
GET  /api/v1/notifications
GET  /api/v1/notifications/{id}
PUT  /api/v1/notifications/{id}/read
PUT  /api/v1/notifications/mark-all-read
WS   /ws/notifications              # WebSocket

# Services
- notification_service.py : Create, send notifications
- email_service.py : SMTP avec templates
- websocket_service.py : Real-time avec ConnectionManager

Types notifications :
- ACCESS_REQUEST_CREATED
- ACCESS_REQUEST_APPROVED
- ACCESS_REQUEST_REJECTED
- RETURN_OVERDUE
- CALIBRATION_DUE
- STOCK_LOW
- CAPACITY_HIGH

Référence : ARCHITECTURE_GLOBALE.md section Notifications
```

**2.7 Reporting Service (Port 8005)**
```python
# Routes
GET /api/v1/reports/inventory
GET /api/v1/reports/movements
GET /api/v1/reports/access-requests
GET /api/v1/reports/audit-trail
GET /api/v1/reports/statistics

Query params : format (pdf, excel, csv), filters, dates

# Services
- report_service.py : Generate reports
- pdf_generator.py : ReportLab
- excel_generator.py : OpenPyXL

Référence : API_SPECIFICATIONS.md section Reporting
```

**2.8 Audit Service (Port 8006)**
```python
# Routes
GET  /api/v1/audit-trail
GET  /api/v1/audit-trail/verify-integrity
POST /api/v1/audit-trail/export

# Services
- audit_service.py : Query audit trail
- integrity_service.py : Verify hash chain

Hash chain :
- SHA-256 de (previous_hash + record_data)
- Immutable (triggers prevent UPDATE/DELETE)

Référence : ARCHITECTURE_GLOBALE.md section Audit Trail
```

### Phase 3 : Database & Migrations

**3.1 Alembic Setup**
```bash
# backend/database/alembic.ini
Configure Alembic avec :
- sqlalchemy.url depuis env vars
- script_location
- version_locations

# backend/database/alembic/env.py
Configure environment :
- Import tous les modèles
- Use async engine
- Context managers
```

**3.2 Migrations Initiales**
```bash
Crée migrations pour TOUTES les tables dans l'ordre :
1. create_users_and_roles
2. create_studies_and_sites
3. create_storage_locations_and_containers
4. create_rfid_tags
5. create_stored_items_polymorphic
6. create_documents_equipment_consumables
7. create_movements
8. create_access_requests
9. create_notifications
10. create_audit_trail_with_partitioning
11. create_system_settings
12. create_sync_queue
13. create_indexes
14. create_triggers_and_functions
15. insert_seed_data

Référence : DATABASE_SCHEMA.md (sections Triggers, Functions, Seed Data)
```

**3.3 Triggers PostgreSQL**
```sql
Crée triggers :
1. update_updated_at_trigger - Auto-update timestamps
2. log_audit_trail_trigger - Auto-log mutations
3. protect_audit_trail_trigger - Prevent modifications
4. generate_access_request_number - Auto-number
5. update_container_count_trigger - Track capacity
6. calculate_audit_hash_trigger - Chain hashes

Référence exacte : DATABASE_SCHEMA.md section Triggers
```

**3.4 Functions PostgreSQL**
```sql
Crée functions :
1. calculate_audit_hash(record) - SHA-256 hash
2. generate_access_request_number() - AR-YYYY-NNNN
3. get_storage_hierarchy(location_id) - Recursive path
4. check_container_capacity(container_id) - Validate capacity

Référence : DATABASE_SCHEMA.md section Functions
```

**3.5 Seed Data**
```python
# backend/scripts/seed_data.py
Insère données initiales :

1. Roles (7 rôles avec permissions) :
   - ADMIN, INVESTIGATOR, ARC, MONITOR, ARCHIVIST, DATA_MANAGER, DATA_CLERK
   - Permissions JSONB par ressource/action

2. System Settings (15+ paramètres) :
   - access_request_default_duration_days: 7
   - access_request_max_extension_days: 7
   - overdue_alert_delay_hours: 12
   - etc.

3. Admin user initial :
   - username: admin
   - password: hash Argon2
   - role: ADMIN
   - active: true

Référence : DATABASE_SCHEMA.md section Seed Data
```

### Phase 4 : Docker & Orchestration

**4.1 Docker Compose**
```yaml
# docker-compose.yml
Services :
- postgres (image: postgres:15, volumes, env, healthcheck)
- postgres-replica (streaming replication)
- redis (image: redis:7-alpine)
- rabbitmq (image: rabbitmq:3-management)
- minio (image: minio/minio, setup buckets)
- auth-service (build, ports: 8000, depends_on)
- core-api (ports: 8001)
- rfid-service (ports: 8002)
- workflow-engine (ports: 8003)
- notification-service (ports: 8004)
- reporting-service (ports: 8005)
- audit-service (ports: 8006)
- nginx (reverse proxy, config volume)

Networks :
- clinical-network (bridge)

Volumes :
- postgres-data
- redis-data
- rabbitmq-data
- minio-data

Référence : IMPLEMENTATION_GUIDE.md section Docker
```

**4.2 Nginx Configuration**
```nginx
# infrastructure/nginx/nginx.conf
Reverse proxy pour tous services :
- /api/v1/auth/* → auth-service:8000
- /api/v1/* → core-api:8001
- /api/v1/rfid/* → rfid-service:8002
- /api/v1/access-requests/* → workflow-engine:8003
- /api/v1/notifications/* → notification-service:8004
- /api/v1/reports/* → reporting-service:8005
- /api/v1/audit-trail/* → audit-service:8006
- /ws/* → notification-service:8004 (WebSocket upgrade)

Health checks, rate limiting, CORS headers

Référence : ARCHITECTURE_GLOBALE.md section Déploiement
```

**4.3 Makefile**
```makefile
# Makefile
Commandes utiles :
- make setup : Setup environment
- make migrate : Run Alembic migrations
- make seed : Insert seed data
- make dev : Start dev environment
- make test : Run all tests
- make lint : Lint code (flake8, black, mypy)
- make clean : Clean containers and volumes
```

### Phase 5 : Tests

**5.1 Configuration Pytest**
```python
# pytest.ini
Configuration :
- asyncio_mode = auto
- testpaths = tests
- python_files = test_*.py
- python_classes = Test*
- python_functions = test_*
- markers pour : unit, integration, slow

# backend/tests/conftest.py
Fixtures partagées :
- async_client : TestClient async
- db_session : Session de test (rollback auto)
- sample_user, sample_study, sample_site, etc.
```

**5.2 Tests par Service**
```python
Pour CHAQUE service, crée tests :

Structure :
tests/
├── unit/
│   ├── test_models.py
│   ├── test_schemas.py
│   └── test_services.py
├── integration/
│   └── test_api_endpoints.py
└── e2e/
    └── test_complete_workflow.py

Objectif : 80%+ coverage

Référence : TEST_PLAN.md
```

### Phase 6 : Documentation

**6.1 README Principal**
```markdown
# backend/README.md
- Architecture overview
- Services description
- Setup instructions
- Running locally
- Running with Docker
- API documentation link
- Testing
- Contributing
```

**6.2 Swagger/OpenAPI**
```python
Chaque service expose /docs et /redoc
Configuration dans main.py avec :
- Metadata complet
- Tags par ressource
- Security schemes (Bearer JWT)
- Exemples requêtes/réponses
```

## Standards de Code à Respecter

### Python Style
- PEP 8 compliant
- Type hints obligatoires
- Docstrings Google style
- Max line length: 100
- Use async/await pour I/O
- Pydantic pour validation
- SQLAlchemy 2.0 syntax

### Structure Fichiers
- Un modèle = un fichier
- Un service = un fichier  
- Routes groupées par ressource
- Tests mirrors structure source

### Sécurité
- JWT avec RS256
- Passwords Argon2
- Input validation stricte
- SQL injection protection (ORM)
- CORS configuration stricte
- Rate limiting sur authentification
- Logs sans données sensibles

### Performance
- Async I/O partout
- Connection pooling
- Indexes sur FK et colonnes filtrées
- Pagination obligatoire (50 items default)
- Eager loading approprié (N+1 prevention)
- Redis cache pour données fréquentes

### Conformité
- Audit trail OBLIGATOIRE sur mutations
- Permissions check dans services
- RGPD : soft delete, anonymization
- GCP/ICH : validation, SOPs

## Ordre d'Exécution

Exécute dans cet ordre strict :

1. ✅ Common module (models, schemas, auth, utils)
2. ✅ Database setup (Alembic config)
3. ✅ Migrations (toutes les tables)
4. ✅ Triggers et functions PostgreSQL
5. ✅ Seed data
6. ✅ Auth Service
7. ✅ Core API
8. ✅ RFID Service
9. ✅ Workflow Engine
10. ✅ Notification Service
11. ✅ Reporting Service
12. ✅ Audit Service
13. ✅ Docker Compose
14. ✅ Nginx config
15. ✅ Tests
16. ✅ Documentation

## Validation

Après chaque phase, vérifie :
- ✅ Pas d'erreurs de syntax
- ✅ Imports résolus
- ✅ Type hints corrects
- ✅ Tests passent
- ✅ Linting OK (flake8, black, mypy)
- ✅ Documentation à jour

## Questions à Poser Avant de Commencer

1. As-tu bien lu TOUS les documents référencés ?
2. Comprends-tu l'architecture globale ?
3. Le schéma de base de données est-il clair ?
4. Les spécifications API sont-elles comprises ?
5. L'ordre d'exécution est-il logique ?

## Note Importante

Ce backend gère des **données critiques de santé**. Chaque ligne de code doit être :
- ✅ Sécurisée
- ✅ Testée
- ✅ Documentée
- ✅ Conforme aux régulations
- ✅ Performante
- ✅ Maintenable

Ne génère RIEN qui compromettrait ces principes.

## Confirmation

Avant de commencer, confirme que tu as :
- [ ] Lu ARCHITECTURE_GLOBALE.md
- [ ] Lu DATABASE_SCHEMA.md  
- [ ] Lu API_SPECIFICATIONS.md
- [ ] Lu IMPLEMENTATION_GUIDE.md
- [ ] Compris la structure complète
- [ ] Identifié les dépendances entre composants
- [ ] Plan d'exécution clair

Puis réponds : "✅ Prêt à initialiser le backend. Je commence par [première étape]."
```

## Utilisation

**Copie ce prompt complet dans Claude Code et lance-le.**

Claude Code va :
1. Lire tous les documents
2. Comprendre l'architecture
3. Générer TOUS les fichiers dans l'ordre
4. Créer la structure complète
5. Tester au fur et à mesure

**Durée estimée : 2-4 heures de génération**

## Après Génération

```bash
# Tester le setup complet
cd backend
docker-compose up -d
make migrate
make seed
make test

# Vérifier que tous les services sont up
curl http://localhost:8000/health  # Auth
curl http://localhost:8001/health  # Core API
curl http://localhost:8002/health  # RFID
curl http://localhost:8003/health  # Workflow
curl http://localhost:8004/health  # Notification
curl http://localhost:8005/health  # Reporting
curl http://localhost:8006/health  # Audit

# Accéder à la doc API
open http://localhost:8001/docs
```

Voilà ! 🚀
