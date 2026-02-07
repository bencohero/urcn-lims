# Plan de Tests - Clinical Storage System

## Vue d'ensemble

Stratégie de tests complète couvrant tous les niveaux : unitaires, intégration, système, performance, sécurité et acceptation utilisateur.

**Objectifs :**
- Couverture de code ≥ 80%
- 0 défaut critique en production
- Temps de réponse API < 500ms (95e percentile)
- Conformité GCP/ICH et RGPD

---

## 1. STRATÉGIE GLOBALE

### 1.1 Pyramide de Tests

```
              /\
             /  \
            / E2E\          E2E Tests (5%)
           /──────\         - Scénarios utilisateur complets
          /        \        - Tests multi-navigateurs
         / Intégra-\       
        /   tion     \      Tests Intégration (15%)
       /──────────────\     - API endpoints
      /                \    - Workflows
     /   Tests          \   
    /   Unitaires        \  Tests Unitaires (80%)
   /______________________\ - Fonctions isolées
                            - Composants React
```

### 1.2 Types de Tests

| Type                  | Couverture | Outils                        | Fréquence        |
|-----------------------|------------|-------------------------------|------------------|
| Unitaires             | 80%        | Pytest, Jest                  | À chaque commit  |
| Intégration           | 15%        | Pytest, Supertest             | À chaque PR      |
| E2E                   | 5%         | Playwright, Cypress           | Avant release    |
| Performance           | -          | Locust, k6                    | Hebdomadaire     |
| Sécurité              | -          | OWASP ZAP, Bandit             | Hebdomadaire     |
| Accessibilité         | -          | Axe, WAVE                     | Avant release    |
| Compatibilité         | -          | BrowserStack                  | Avant release    |

---

## 2. TESTS UNITAIRES

### 2.1 Backend (Python/FastAPI)

#### 2.1.1 Structure Tests

```
tests/
├── unit/
│   ├── models/
│   │   ├── test_document.py
│   │   ├── test_equipment.py
│   │   ├── test_user.py
│   │   └── test_access_request.py
│   ├── services/
│   │   ├── test_document_service.py
│   │   ├── test_auth_service.py
│   │   ├── test_workflow_service.py
│   │   └── test_rfid_service.py
│   ├── routes/
│   │   ├── test_documents_routes.py
│   │   ├── test_auth_routes.py
│   │   └── test_access_requests_routes.py
│   └── utils/
│       ├── test_validators.py
│       ├── test_permissions.py
│       └── test_encryption.py
├── integration/
├── e2e/
└── fixtures/
    ├── users.py
    ├── studies.py
    └── documents.py
```

---

#### 2.1.2 Exemples Tests Unitaires

**Test Modèle Document:**

```python
# tests/unit/models/test_document.py
import pytest
from datetime import date
from app.models.document import Document
from app.models.stored_item import StoredItem

def test_document_creation(db_session):
    """Test création document valide."""
    stored_item = StoredItem(
        study_id=uuid4(),
        site_id=uuid4(),
        item_type='DOCUMENT',
        storage_date=date.today()
    )
    db_session.add(stored_item)
    db_session.flush()
    
    document = Document(
        id=stored_item.id,
        document_type='CONSENT',
        subject_id='SUBJ-001',
        page_count=8,
        signature_required=True,
        confidentiality_level='HIGH'
    )
    
    assert document.document_type == 'CONSENT'
    assert document.subject_id == 'SUBJ-001'
    assert document.signature_required is True

def test_document_invalid_type(db_session):
    """Test document avec type invalide."""
    with pytest.raises(ValueError):
        document = Document(
            document_type='INVALID_TYPE',
            subject_id='SUBJ-001'
        )

def test_document_relationships(db_session, sample_stored_item):
    """Test relations document."""
    document = Document(
        id=sample_stored_item.id,
        document_type='CRF',
        subject_id='SUBJ-002'
    )
    db_session.add(document)
    db_session.commit()
    
    assert document.stored_item is not None
    assert document.stored_item.item_type == 'DOCUMENT'
```

---

**Test Service Document:**

```python
# tests/unit/services/test_document_service.py
import pytest
from unittest.mock import Mock, patch
from app.services.document_service import DocumentService
from app.schemas.document import DocumentCreate

@pytest.fixture
def document_service(db_session):
    return DocumentService(db_session)

@pytest.mark.asyncio
async def test_create_document_success(document_service, sample_user, sample_study, sample_site):
    """Test création document avec succès."""
    document_data = DocumentCreate(
        study_id=sample_study.id,
        site_id=sample_site.id,
        document_type='CONSENT',
        subject_id='SUBJ-100',
        storage_date=date.today(),
        internal_code='CONSENT-100',
        description='Test consent form'
    )
    
    document = await document_service.create_document(document_data, sample_user)
    
    assert document is not None
    assert document.document_type == 'CONSENT'
    assert document.subject_id == 'SUBJ-100'

@pytest.mark.asyncio
async def test_create_document_duplicate_code(document_service, sample_user, sample_study, sample_site):
    """Test création document avec code dupliqué."""
    # Créer premier document
    doc1_data = DocumentCreate(
        study_id=sample_study.id,
        site_id=sample_site.id,
        document_type='CONSENT',
        subject_id='SUBJ-101',
        internal_code='CONSENT-101',
        storage_date=date.today()
    )
    await document_service.create_document(doc1_data, sample_user)
    
    # Tenter de créer second avec même code
    doc2_data = DocumentCreate(
        study_id=sample_study.id,
        site_id=sample_site.id,
        document_type='CRF',
        subject_id='SUBJ-102',
        internal_code='CONSENT-101',  # Même code
        storage_date=date.today()
    )
    
    with pytest.raises(ValueError, match="Code already exists"):
        await document_service.create_document(doc2_data, sample_user)

@pytest.mark.asyncio
async def test_get_documents_with_filters(document_service, sample_user):
    """Test récupération documents avec filtres."""
    # Créer plusieurs documents de test
    # ...
    
    documents = await document_service.get_documents(
        study_id=sample_study.id,
        document_type='CONSENT',
        status='IN_STORAGE',
        user=sample_user
    )
    
    assert len(documents) > 0
    assert all(d.document_type == 'CONSENT' for d in documents)
    assert all(d.stored_item.status == 'IN_STORAGE' for d in documents)

@pytest.mark.asyncio
async def test_permissions_filtering(document_service, regular_user):
    """Test filtrage par permissions utilisateur."""
    # regular_user n'a accès qu'au site Paris
    documents = await document_service.get_documents(user=regular_user)
    
    # Vérifier que seuls les documents du site Paris sont retournés
    allowed_site_ids = [site.id for site in regular_user.sites]
    assert all(d.stored_item.site_id in allowed_site_ids for d in documents)
```

---

**Test Route API:**

```python
# tests/unit/routes/test_documents_routes.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_document_success(async_client: AsyncClient, auth_headers, sample_study, sample_site):
    """Test création document via API."""
    document_data = {
        "study_id": str(sample_study.id),
        "site_id": str(sample_site.id),
        "document_type": "CONSENT",
        "subject_id": "SUBJ-200",
        "storage_date": "2026-02-03",
        "internal_code": "CONSENT-200"
    }
    
    response = await async_client.post(
        "/api/v1/documents",
        json=document_data,
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["document_type"] == "CONSENT"
    assert data["subject_id"] == "SUBJ-200"

@pytest.mark.asyncio
async def test_create_document_unauthorized(async_client: AsyncClient):
    """Test création sans authentification."""
    document_data = {
        "study_id": str(uuid4()),
        "site_id": str(uuid4()),
        "document_type": "CONSENT",
        "subject_id": "SUBJ-201",
        "storage_date": "2026-02-03"
    }
    
    response = await async_client.post(
        "/api/v1/documents",
        json=document_data
    )
    
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_create_document_validation_error(async_client: AsyncClient, auth_headers):
    """Test validation données invalides."""
    invalid_data = {
        "study_id": "invalid-uuid",  # UUID invalide
        "document_type": "CONSENT",
        "subject_id": "SUBJ-202"
        # storage_date manquant (requis)
    }
    
    response = await async_client.post(
        "/api/v1/documents",
        json=invalid_data,
        headers=auth_headers
    )
    
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_get_documents_pagination(async_client: AsyncClient, auth_headers):
    """Test pagination liste documents."""
    response = await async_client.get(
        "/api/v1/documents?page=1&page_size=10",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) <= 10

@pytest.mark.asyncio
async def test_get_document_by_id(async_client: AsyncClient, auth_headers, sample_document):
    """Test récupération document par ID."""
    response = await async_client.get(
        f"/api/v1/documents/{sample_document.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["id"] == str(sample_document.id)

@pytest.mark.asyncio
async def test_get_document_not_found(async_client: AsyncClient, auth_headers):
    """Test document inexistant."""
    non_existent_id = uuid4()
    response = await async_client.get(
        f"/api/v1/documents/{non_existent_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_update_document(async_client: AsyncClient, auth_headers, sample_document):
    """Test mise à jour document."""
    update_data = {
        "physical_condition": "FAIR",
        "location_notes": "Moved to new location"
    }
    
    response = await async_client.put(
        f"/api/v1/documents/{sample_document.id}",
        json=update_data,
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["stored_item"]["physical_condition"] == "FAIR"
```

---

### 2.2 Frontend (React/Next.js)

#### 2.2.1 Structure Tests

```
frontend/
├── __tests__/
│   ├── components/
│   │   ├── DocumentsTable.test.tsx
│   │   ├── DocumentForm.test.tsx
│   │   └── AccessRequestModal.test.tsx
│   ├── hooks/
│   │   ├── useDocuments.test.ts
│   │   ├── useAuth.test.ts
│   │   └── useOfflineSync.test.ts
│   ├── lib/
│   │   ├── api/
│   │   │   └── documents.test.ts
│   │   └── utils/
│   │       └── validators.test.ts
│   └── pages/
│       ├── login.test.tsx
│       └── dashboard.test.tsx
└── jest.config.js
```

---

#### 2.2.2 Exemples Tests Frontend

**Test Composant Table:**

```typescript
// __tests__/components/DocumentsTable.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DocumentsTable } from '@/components/documents/DocumentsTable';
import { documentsApi } from '@/lib/api/documents';

jest.mock('@/lib/api/documents');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('DocumentsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (documentsApi.getDocuments as jest.Mock).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(<DocumentsTable />, { wrapper: createWrapper() });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders documents when data is loaded', async () => {
    const mockDocuments = [
      {
        id: '1',
        document_type: 'CONSENT',
        subject_id: 'SUBJ-001',
        description: 'Test document',
        status: 'IN_STORAGE',
        site: { name: 'CHU Paris' },
        storage_date: '2026-02-03',
      },
    ];

    (documentsApi.getDocuments as jest.Mock).mockResolvedValue(mockDocuments);

    render(<DocumentsTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CONSENT')).toBeInTheDocument();
      expect(screen.getByText('SUBJ-001')).toBeInTheDocument();
      expect(screen.getByText('CHU Paris')).toBeInTheDocument();
    });
  });

  it('handles search input', async () => {
    const user = userEvent.setup();
    (documentsApi.getDocuments as jest.Mock).mockResolvedValue([]);

    render(<DocumentsTable />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search documents/i);
    await user.type(searchInput, 'SUBJ-001');

    await waitFor(() => {
      expect(documentsApi.getDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'SUBJ-001' })
      );
    });
  });

  it('displays error message on API failure', async () => {
    (documentsApi.getDocuments as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    render(<DocumentsTable />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error loading documents/i)).toBeInTheDocument();
    });
  });
});
```

---

**Test Hook Custom:**

```typescript
// __tests__/hooks/useDocuments.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDocuments } from '@/lib/hooks/useDocuments';
import { documentsApi } from '@/lib/api/documents';

jest.mock('@/lib/api/documents');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useDocuments', () => {
  it('fetches documents successfully', async () => {
    const mockDocuments = [
      { id: '1', document_type: 'CONSENT' },
      { id: '2', document_type: 'CRF' },
    ];

    (documentsApi.getDocuments as jest.Mock).mockResolvedValue(mockDocuments);

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockDocuments);
    expect(result.current.data).toHaveLength(2);
  });

  it('handles error state', async () => {
    (documentsApi.getDocuments as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useDocuments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('passes filters to API', async () => {
    (documentsApi.getDocuments as jest.Mock).mockResolvedValue([]);

    const filters = {
      study_id: 'study-123',
      document_type: 'CONSENT',
    };

    renderHook(() => useDocuments(filters), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(documentsApi.getDocuments).toHaveBeenCalledWith(filters);
    });
  });
});
```

---

## 3. TESTS D'INTÉGRATION

### 3.1 Tests API End-to-End

```python
# tests/integration/test_document_workflow.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_complete_document_lifecycle(
    async_client: AsyncClient,
    archivist_headers,
    monitor_headers,
    sample_study,
    sample_site
):
    """Test cycle de vie complet d'un document."""
    
    # 1. Archiviste crée document
    create_response = await async_client.post(
        "/api/v1/documents",
        json={
            "study_id": str(sample_study.id),
            "site_id": str(sample_site.id),
            "document_type": "CONSENT",
            "subject_id": "SUBJ-INTEG-001",
            "storage_date": "2026-02-03",
            "internal_code": "CONSENT-INTEG-001"
        },
        headers=archivist_headers
    )
    assert create_response.status_code == 201
    document = create_response.json()["data"]
    document_id = document["id"]
    
    # 2. Moniteur demande accès
    request_response = await async_client.post(
        "/api/v1/access-requests",
        json={
            "stored_item_id": document_id,
            "requester_site_id": str(sample_site.id),
            "request_type": "CONSULTATION",
            "purpose": "Integration test monitoring",
            "urgency": "NORMAL"
        },
        headers=monitor_headers
    )
    assert request_response.status_code == 201
    access_request = request_response.json()["data"]
    request_id = access_request["id"]
    assert access_request["status"] == "PENDING"
    
    # 3. Archiviste approuve demande
    approve_response = await async_client.put(
        f"/api/v1/access-requests/{request_id}/approve",
        json={
            "approved_duration_days": 7,
            "review_notes": "Approved for integration test"
        },
        headers=archivist_headers
    )
    assert approve_response.status_code == 200
    approved_request = approve_response.json()["data"]
    assert approved_request["status"] == "APPROVED"
    
    # 4. Archiviste marque comme sorti
    fulfill_response = await async_client.put(
        f"/api/v1/access-requests/{request_id}/fulfill",
        json={
            "actual_access_date": "2026-02-03T11:00:00Z"
        },
        headers=archivist_headers
    )
    assert fulfill_response.status_code == 200
    
    # 5. Vérifier document est OUT
    doc_response = await async_client.get(
        f"/api/v1/documents/{document_id}",
        headers=archivist_headers
    )
    assert doc_response.json()["data"]["status"] == "OUT"
    
    # 6. Archiviste enregistre retour
    return_response = await async_client.put(
        f"/api/v1/access-requests/{request_id}/return",
        json={
            "actual_return_date": "2026-02-09T14:00:00Z"
        },
        headers=archivist_headers
    )
    assert return_response.status_code == 200
    
    # 7. Vérifier document est IN_STORAGE
    final_doc_response = await async_client.get(
        f"/api/v1/documents/{document_id}",
        headers=archivist_headers
    )
    assert final_doc_response.json()["data"]["status"] == "IN_STORAGE"
    
    # 8. Vérifier audit trail complet
    audit_response = await async_client.get(
        f"/api/v1/audit-trail?table_name=documents&record_id={document_id}",
        headers=archivist_headers
    )
    assert audit_response.status_code == 200
    audit_entries = audit_response.json()["data"]["items"]
    assert len(audit_entries) >= 3  # CREATE, UPDATE (OUT), UPDATE (IN)
```

---

### 3.2 Tests RFID Service

```python
# tests/integration/test_rfid_workflow.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_rfid_tag_lifecycle(
    async_client: AsyncClient,
    archivist_headers,
    sample_document
):
    """Test cycle de vie tag RFID."""
    
    # 1. Encoder nouveau tag
    encode_response = await async_client.post(
        "/api/v1/rfid/tags",
        json={
            "associated_item_id": str(sample_document.id),
            "associated_item_type": "DOCUMENT",
            "user_memory": {
                "study_id": str(sample_document.stored_item.study_id),
                "site_id": str(sample_document.stored_item.site_id),
                "item_type": "DOCUMENT"
            }
        },
        headers=archivist_headers
    )
    assert encode_response.status_code == 201
    tag = encode_response.json()["data"]
    epc = tag["epc"]
    
    # 2. Lire tag
    read_response = await async_client.post(
        "/api/v1/rfid/read",
        json={
            "reader_id": "READER-001",
            "epc": epc
        },
        headers=archivist_headers
    )
    assert read_response.status_code == 200
    read_data = read_response.json()["data"]
    assert read_data["item"]["id"] == str(sample_document.id)
    
    # 3. Inventaire bulk
    bulk_response = await async_client.post(
        "/api/v1/rfid/bulk-read",
        json={
            "reader_id": "READER-001",
            "location_id": str(sample_document.stored_item.container.location_id),
            "epcs": [epc]
        },
        headers=archivist_headers
    )
    assert bulk_response.status_code == 200
    bulk_data = bulk_response.json()["data"]
    assert bulk_data["successful_reads"] == 1
    assert len(bulk_data["tags"]) == 1
```

---

## 4. TESTS END-TO-END (E2E)

### 4.1 Configuration Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### 4.2 Scénarios E2E

```typescript
// e2e/document-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Document Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="username"]', 'jean.archiviste');
    await page.fill('[name="password"]', 'TestP@ss123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('create new document successfully', async ({ page }) => {
    // Naviguer vers page documents
    await page.click('text=Documents');
    await expect(page).toHaveURL('/documents');

    // Cliquer sur "Nouveau"
    await page.click('button:has-text("Nouveau")');

    // Remplir formulaire
    await page.selectOption('[name="study_id"]', { label: 'PROTO-2026-001' });
    await page.selectOption('[name="site_id"]', { label: 'CHU Paris' });
    await page.selectOption('[name="document_type"]', 'CONSENT');
    await page.fill('[name="subject_id"]', 'SUBJ-E2E-001');
    await page.fill('[name="description"]', 'E2E test document');
    await page.selectOption('[name="location_id"]', { label: 'Archive Room 1' });
    await page.selectOption('[name="container_id"]', { label: 'Cabinet A1' });

    // Soumettre
    await page.click('button:has-text("Enregistrer")');

    // Vérifier succès
    await expect(page.locator('.toast-success')).toContainText(
      'Document created successfully'
    );

    // Vérifier document dans liste
    await page.fill('[placeholder="Search documents..."]', 'SUBJ-E2E-001');
    await expect(page.locator('table')).toContainText('SUBJ-E2E-001');
  });

  test('search and filter documents', async ({ page }) => {
    await page.goto('/documents');

    // Recherche texte
    await page.fill('[placeholder="Search documents..."]', 'CONSENT');
    await page.waitForTimeout(500); // Debounce

    // Vérifier résultats filtrés
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toContainText('CONSENT');

    // Filtrer par site
    await page.selectOption('[name="site_filter"]', { label: 'CHU Paris' });

    // Vérifier résultats
    const siteRows = page.locator('tbody tr');
    const count = await siteRows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(siteRows.nth(i)).toContainText('Paris');
    }
  });

  test('view document details', async ({ page }) => {
    await page.goto('/documents');

    // Cliquer sur premier document
    await page.click('tbody tr:first-child button:has-text("View")');

    // Vérifier modal détails
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('[role="dialog"]')).toContainText('Localisation Physique');
    await expect(page.locator('[role="dialog"]')).toContainText('Tag RFID');
  });
});
```

---

```typescript
// e2e/access-request-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Access Request Workflow', () => {
  test('complete access request flow', async ({ browser }) => {
    // Créer 2 contextes : Moniteur et Archiviste
    const monitorContext = await browser.newContext();
    const monitorPage = await monitorContext.newPage();

    const archivistContext = await browser.newContext();
    const archivistPage = await archivistContext.newPage();

    // 1. Moniteur se connecte et crée demande
    await monitorPage.goto('/login');
    await monitorPage.fill('[name="username"]', 'sophie.moniteur');
    await monitorPage.fill('[name="password"]', 'TestP@ss123');
    await monitorPage.click('button[type="submit"]');

    await monitorPage.click('text=Demandes d\'Accès');
    await monitorPage.click('button:has-text("Nouvelle")');

    await monitorPage.fill('[placeholder="Search document..."]', 'SUBJ-001');
    await monitorPage.click('text=CONSENT-SUBJ-001');
    await monitorPage.fill('[name="purpose"]', 'E2E test monitoring visit');
    await monitorPage.selectOption('[name="urgency"]', 'HIGH');
    await monitorPage.click('button:has-text("Soumettre")');

    // Récupérer numéro demande
    const requestNumber = await monitorPage
      .locator('.toast-success')
      .textContent();
    const requestId = requestNumber?.match(/AR-\d{4}-\d{4}/)?.[0];

    // 2. Archiviste se connecte et approuve
    await archivistPage.goto('/login');
    await archivistPage.fill('[name="username"]', 'jean.archiviste');
    await archivistPage.fill('[name="password"]', 'TestP@ss123');
    await archivistPage.click('button[type="submit"]');

    await archivistPage.click('text=Demandes d\'Accès');
    await archivistPage.click(`text=${requestId}`);

    await archivistPage.click('button:has-text("Approuver")');
    await archivistPage.fill('[name="approved_duration_days"]', '7');
    await archivistPage.fill('[name="review_notes"]', 'Approved for E2E test');
    await archivistPage.click('button[type="submit"]');

    // Vérifier notification
    await expect(archivistPage.locator('.toast-success')).toContainText(
      'approved'
    );

    // 3. Moniteur vérifie approbation
    await monitorPage.reload();
    await expect(monitorPage.locator(`text=${requestId}`)).toContainText(
      'APPROVED'
    );

    // Cleanup
    await monitorContext.close();
    await archivistContext.close();
  });
});
```

---

## 5. TESTS DE PERFORMANCE

### 5.1 Tests de Charge (Locust)

```python
# tests/performance/locustfile.py
from locust import HttpUser, task, between
import random

class ClinicalStorageUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login avant tests."""
        response = self.client.post("/api/v1/auth/login", json={
            "username": "test_user",
            "password": "TestP@ss123"
        })
        self.token = response.json()["data"]["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def list_documents(self):
        """Test liste documents (tâche fréquente)."""
        self.client.get(
            "/api/v1/documents?page=1&page_size=50",
            headers=self.headers,
            name="/api/v1/documents [LIST]"
        )
    
    @task(2)
    def search_documents(self):
        """Test recherche documents."""
        search_terms = ["CONSENT", "CRF", "SUBJ-001", "SOURCE"]
        term = random.choice(search_terms)
        self.client.get(
            f"/api/v1/documents?search={term}",
            headers=self.headers,
            name="/api/v1/documents [SEARCH]"
        )
    
    @task(1)
    def get_document_details(self):
        """Test détails document."""
        # Supposer qu'on a une liste d'IDs
        doc_id = random.choice(self.document_ids)
        self.client.get(
            f"/api/v1/documents/{doc_id}",
            headers=self.headers,
            name="/api/v1/documents/{id} [GET]"
        )
    
    @task(1)
    def create_document(self):
        """Test création document."""
        doc_data = {
            "study_id": self.study_id,
            "site_id": self.site_id,
            "document_type": "CONSENT",
            "subject_id": f"SUBJ-PERF-{random.randint(1000, 9999)}",
            "storage_date": "2026-02-03",
            "internal_code": f"PERF-{random.randint(1000, 9999)}"
        }
        self.client.post(
            "/api/v1/documents",
            json=doc_data,
            headers=self.headers,
            name="/api/v1/documents [CREATE]"
        )
    
    @task(2)
    def list_access_requests(self):
        """Test liste demandes accès."""
        self.client.get(
            "/api/v1/access-requests?status=PENDING",
            headers=self.headers,
            name="/api/v1/access-requests [LIST]"
        )

# Exécution:
# locust -f tests/performance/locustfile.py --host=http://localhost
# Objectifs:
# - 100 utilisateurs concurrents
# - Temps réponse p95 < 500ms
# - Taux erreur < 1%
```

---

### 5.2 Tests de Stress (k6)

```javascript
// tests/performance/stress-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up à 100 users
    { duration: '5m', target: 100 },  // Maintien 100 users
    { duration: '2m', target: 200 },  // Ramp up à 200 users
    { duration: '5m', target: 200 },  // Maintien 200 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% requêtes < 500ms
    errors: ['rate<0.01'],             // Taux erreur < 1%
  },
};

const BASE_URL = 'http://localhost/api/v1';

let authToken;

export function setup() {
  // Login une fois
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    username: 'test_user',
    password: 'TestP@ss123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  authToken = loginRes.json('data.access_token');
  return { token: authToken };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Scénario mixte
  const scenarios = [
    () => http.get(`${BASE_URL}/documents?page=1&page_size=50`, { headers }),
    () => http.get(`${BASE_URL}/access-requests?status=PENDING`, { headers }),
    () => http.get(`${BASE_URL}/studies`, { headers }),
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  const res = scenario();

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);
}

// Exécution:
// k6 run tests/performance/stress-test.js
```

---

## 6. TESTS DE SÉCURITÉ

### 6.1 Tests OWASP Top 10

```python
# tests/security/test_owasp.py
import pytest
from httpx import AsyncClient

@pytest.mark.security
class TestOWASPVulnerabilities:
    """Tests vulnérabilités OWASP Top 10."""
    
    @pytest.mark.asyncio
    async def test_sql_injection_prevention(self, async_client: AsyncClient, auth_headers):
        """Test protection contre SQL injection."""
        malicious_inputs = [
            "' OR '1'='1",
            "1; DROP TABLE users--",
            "' UNION SELECT * FROM users--",
            "admin'--",
        ]
        
        for payload in malicious_inputs:
            response = await async_client.get(
                f"/api/v1/documents?search={payload}",
                headers=auth_headers
            )
            # Ne devrait pas causer d'erreur serveur
            assert response.status_code != 500
            # Ne devrait pas retourner données sensibles
            if response.status_code == 200:
                data = response.json()
                assert "password" not in str(data).lower()
    
    @pytest.mark.asyncio
    async def test_xss_prevention(self, async_client: AsyncClient, auth_headers):
        """Test protection contre XSS."""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
        ]
        
        for payload in xss_payloads:
            response = await async_client.post(
                "/api/v1/documents",
                json={
                    "description": payload,
                    # ... autres champs requis
                },
                headers=auth_headers
            )
            
            if response.status_code == 201:
                doc_id = response.json()["data"]["id"]
                get_response = await async_client.get(
                    f"/api/v1/documents/{doc_id}",
                    headers=auth_headers
                )
                # Payload doit être échappé
                content = get_response.text
                assert "<script>" not in content
    
    @pytest.mark.asyncio
    async def test_authentication_required(self, async_client: AsyncClient):
        """Test endpoints protégés."""
        protected_endpoints = [
            "/api/v1/documents",
            "/api/v1/users",
            "/api/v1/access-requests",
            "/api/v1/admin/settings",
        ]
        
        for endpoint in protected_endpoints:
            response = await async_client.get(endpoint)
            assert response.status_code == 401
    
    @pytest.mark.asyncio
    async def test_csrf_protection(self, async_client: AsyncClient, auth_headers):
        """Test protection CSRF pour mutations."""
        # Tentative sans CSRF token
        response = await async_client.post(
            "/api/v1/documents",
            json={},
            headers={"Authorization": auth_headers["Authorization"]}
            # Manque CSRF token
        )
        # Devrait être rejeté ou avoir validation additionnelle
        assert response.status_code in [400, 403]
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self, async_client: AsyncClient):
        """Test rate limiting sur login."""
        # Tenter 20 logins rapides
        for _ in range(20):
            await async_client.post("/api/v1/auth/login", json={
                "username": "test",
                "password": "wrong"
            })
        
        # 21ème tentative devrait être rate limited
        response = await async_client.post("/api/v1/auth/login", json={
            "username": "test",
            "password": "wrong"
        })
        assert response.status_code == 429
    
    @pytest.mark.asyncio
    async def test_sensitive_data_exposure(self, async_client: AsyncClient, auth_headers):
        """Test pas d'exposition données sensibles."""
        response = await async_client.get(
            "/api/v1/auth/me",
            headers=auth_headers
        )
        
        user_data = response.json()["data"]
        # Password hash ne doit jamais être exposé
        assert "password" not in user_data
        assert "password_hash" not in user_data
```

---

### 6.2 Scan Automatisé (OWASP ZAP)

```python
# tests/security/zap_scan.py
from zapv2 import ZAPv2
import time

def run_zap_scan():
    """Exécute scan OWASP ZAP."""
    zap = ZAPv2(proxies={'http': 'http://127.0.0.1:8080', 'https': 'http://127.0.0.1:8080'})
    
    target = 'http://localhost:3000'
    
    print('Accessing target...')
    zap.urlopen(target)
    time.sleep(2)
    
    print('Spidering target...')
    scan_id = zap.spider.scan(target)
    while int(zap.spider.status(scan_id)) < 100:
        print(f'Spider progress: {zap.spider.status(scan_id)}%')
        time.sleep(5)
    
    print('Spider completed')
    
    print('Scanning target...')
    scan_id = zap.ascan.scan(target)
    while int(zap.ascan.status(scan_id)) < 100:
        print(f'Scan progress: {zap.ascan.status(scan_id)}%')
        time.sleep(5)
    
    print('Scan completed')
    
    # Récupérer alertes
    alerts = zap.core.alerts(baseurl=target)
    
    print(f'\nTotal alerts: {len(alerts)}')
    
    high_risk = [a for a in alerts if a['risk'] == 'High']
    medium_risk = [a for a in alerts if a['risk'] == 'Medium']
    
    print(f'High risk: {len(high_risk)}')
    print(f'Medium risk: {len(medium_risk)}')
    
    # Fail si vulnérabilités critiques
    assert len(high_risk) == 0, f"Found {len(high_risk)} high risk vulnerabilities"
    
    # Générer rapport
    with open('zap_report.html', 'w') as f:
        f.write(zap.core.htmlreport())
    
    print('Report saved to zap_report.html')

if __name__ == '__main__':
    run_zap_scan()
```

---

## 7. TESTS D'ACCESSIBILITÉ

```typescript
// tests/accessibility/a11y.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('dashboard page should not have accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('documents page should not have accessibility violations', async ({ page }) => {
    await page.goto('/documents');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/documents');
    
    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Vérifier focus visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Enter pour activer
    await page.keyboard.press('Enter');
    
    // Vérifier action effectuée
    // ...
  });

  test('screen reader landmarks should be present', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier présence landmarks ARIA
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();
    await expect(page.locator('[role="banner"]')).toBeVisible();
  });
});
```

---

## 8. TESTS DE COMPATIBILITÉ

### 8.1 Tests Multi-Navigateurs

```typescript
// playwright.config.ts (extrait)
export default defineConfig({
  projects: [
    { name: 'Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Safari', use: { ...devices['Desktop Safari'] } },
    { name: 'Edge', use: { ...devices['Desktop Edge'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

---

## 9. RAPPORTS & MÉTRIQUES

### 9.1 Couverture de Code

```bash
# Backend (Coverage.py)
pytest --cov=app --cov-report=html --cov-report=term

# Frontend (Jest)
npm test -- --coverage

# Seuils requis:
# - Statements: 80%
# - Branches: 75%
# - Functions: 80%
# - Lines: 80%
```

---

### 9.2 Rapport Consolidé

```json
{
  "test_summary": {
    "total_tests": 1247,
    "passed": 1245,
    "failed": 2,
    "skipped": 0,
    "duration": "15m 32s"
  },
  "coverage": {
    "backend": {
      "statements": 85.3,
      "branches": 78.1,
      "functions": 82.5,
      "lines": 84.9
    },
    "frontend": {
      "statements": 81.7,
      "branches": 76.4,
      "functions": 79.8,
      "lines": 81.2
    }
  },
  "performance": {
    "api_response_p95": 423,
    "page_load_time": 1.2,
    "concurrent_users_max": 250
  },
  "security": {
    "vulnerabilities_high": 0,
    "vulnerabilities_medium": 3,
    "vulnerabilities_low": 12
  }
}
```

---

## 10. CI/CD INTÉGRATION

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run tests with coverage
        run: |
          pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install Playwright
        run: |
          npm ci
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Bandit
        run: |
          pip install bandit
          bandit -r app/ -f json -o bandit-report.json
      
      - name: Run npm audit
        run: npm audit --audit-level=high
```

---

**Document créé le:** 2026-02-03  
**Version:** 1.0  
**Couverture cible:** ≥80%
