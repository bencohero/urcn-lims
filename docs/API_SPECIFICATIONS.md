# API Specifications - Clinical Storage System

## Vue d'ensemble

API RESTful construite avec FastAPI, suivant les standards OpenAPI 3.0, avec authentification JWT et documentation interactive (Swagger/ReDoc).

---

## 1. ARCHITECTURE API

### 1.1 Structure des Services

```
API Gateway (Nginx) → Port 80/443
├── Auth Service → Port 8000
├── Core API → Port 8001
├── RFID Service → Port 8002
├── Workflow Engine → Port 8003
├── Notification Service → Port 8004
├── Reporting Service → Port 8005
└── Audit Service → Port 8006
```

### 1.2 Base URLs

```
Production: https://clinical-storage.yourorg.com/api/v1
Développement: http://localhost/api/v1
```

### 1.3 Standards Communs

**Format Réponse Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-02-03T10:30:00Z"
}
```

**Format Réponse Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2026-02-03T10:30:00Z"
}
```

**Codes HTTP Standard:**
- 200: OK
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 429: Too Many Requests
- 500: Internal Server Error

---

## 2. AUTH SERVICE (Port 8000)

### 2.1 POST /auth/login

Authentification utilisateur.

**Request:**
```json
{
  "username": "john.doe",
  "password": "SecureP@ss123",
  "mfa_code": "123456"  // optionnel si MFA activé
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 900,  // 15 minutes
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john.doe",
      "email": "john.doe@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "roles": [
        {
          "code": "ARCHIVIST",
          "name": "Archiviste"
        }
      ],
      "sites": [
        {
          "id": "660e8400-e29b-41d4-a716-446655440000",
          "site_number": "001",
          "name": "Site Paris"
        }
      ]
    }
  }
}
```

---

### 2.2 POST /auth/refresh

Renouvellement token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 900
  }
}
```

---

### 2.3 POST /auth/logout

Déconnexion (invalidation tokens).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response 204:**
No content.

---

### 2.4 GET /auth/me

Informations utilisateur connecté.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john.doe",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+33612345678",
    "is_active": true,
    "mfa_enabled": false,
    "roles": [...],
    "sites": [...],
    "permissions": {
      "documents": {"create": true, "read": true, "update": true, "delete": false},
      "access_requests": {"create": true, "read": true, "approve": true}
    },
    "last_login": "2026-02-03T09:15:00Z",
    "created_at": "2025-06-01T10:00:00Z"
  }
}
```

---

### 2.5 PUT /auth/change-password

Changement mot de passe.

**Request:**
```json
{
  "current_password": "OldP@ss123",
  "new_password": "NewSecureP@ss456",
  "confirm_password": "NewSecureP@ss456"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 3. CORE API SERVICE (Port 8001)

### 3.1 ÉTUDES (Studies)

#### GET /studies

Liste toutes les études (avec pagination).

**Query Parameters:**
```
?page=1
&page_size=20
&status=ACTIVE
&search=protocol
&sort_by=created_at
&sort_order=desc
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "protocol_number": "PROTO-2026-001",
        "title": "Phase III Study of Drug X",
        "sponsor": "PharmaCorp",
        "phase": "Phase III",
        "therapeutic_area": "Oncology",
        "start_date": "2026-01-15",
        "end_date": "2028-12-31",
        "estimated_enrollment": 500,
        "status": "ACTIVE",
        "sites_count": 7,
        "created_at": "2025-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 15,
      "total_pages": 1
    }
  }
}
```

---

#### POST /studies

Créer nouvelle étude.

**Request:**
```json
{
  "protocol_number": "PROTO-2026-002",
  "title": "Study of Drug Y in Diabetes",
  "sponsor": "BioTech Inc",
  "phase": "Phase II",
  "therapeutic_area": "Endocrinology",
  "start_date": "2026-03-01",
  "end_date": "2027-12-31",
  "estimated_enrollment": 200,
  "retention_period_years": 15,
  "description": "Multicenter randomized controlled trial..."
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "protocol_number": "PROTO-2026-002",
    ...
  },
  "message": "Study created successfully"
}
```

---

#### GET /studies/{study_id}

Détails étude spécifique.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "protocol_number": "PROTO-2026-001",
    "title": "Phase III Study of Drug X",
    "sponsor": "PharmaCorp",
    "phase": "Phase III",
    "therapeutic_area": "Oncology",
    "start_date": "2026-01-15",
    "end_date": "2028-12-31",
    "estimated_enrollment": 500,
    "status": "ACTIVE",
    "retention_period_years": 10,
    "description": "...",
    "sites": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "site_number": "001",
        "name": "CHU Paris",
        "city": "Paris",
        "country": "France",
        "status": "ACTIVE",
        "principal_investigator": {
          "id": "...",
          "name": "Dr. Marie Dupont"
        }
      }
    ],
    "statistics": {
      "total_documents": 1250,
      "total_equipment": 45,
      "total_consumables": 320,
      "active_access_requests": 12
    },
    "created_at": "2025-12-01T10:00:00Z",
    "updated_at": "2026-02-01T15:30:00Z"
  }
}
```

---

#### PUT /studies/{study_id}

Mettre à jour étude.

**Request:**
```json
{
  "status": "PAUSED",
  "end_date": "2029-06-30"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Study updated successfully"
}
```

---

### 3.2 SITES

#### GET /sites

Liste sites (filtrable par étude).

**Query Parameters:**
```
?study_id=770e8400-e29b-41d4-a716-446655440000
&status=ACTIVE
&country=France
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440000",
        "study_id": "770e8400-e29b-41d4-a716-446655440000",
        "site_number": "001",
        "name": "CHU Paris",
        "country": "France",
        "city": "Paris",
        "status": "ACTIVE",
        "has_offline_capability": true,
        "storage_locations_count": 3,
        "total_items_stored": 1580,
        "principal_investigator": {
          "name": "Dr. Marie Dupont",
          "email": "marie.dupont@chu-paris.fr"
        }
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST /sites

Créer nouveau site.

**Request:**
```json
{
  "study_id": "770e8400-e29b-41d4-a716-446655440000",
  "site_number": "008",
  "name": "CHU Lyon",
  "country": "France",
  "city": "Lyon",
  "address": "165 Chemin du Grand Revoyet",
  "postal_code": "69495",
  "phone": "+33426109230",
  "email": "recherche@chu-lyon.fr",
  "principal_investigator_id": "550e8400-e29b-41d4-a716-446655440000",
  "activation_date": "2026-03-15",
  "has_offline_capability": true,
  "timezone": "Europe/Paris"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Site created successfully"
}
```

---

### 3.3 LOCALISATIONS STOCKAGE

#### GET /storage-locations

Liste localisations (hiérarchique).

**Query Parameters:**
```
?site_id=660e8400-e29b-41d4-a716-446655440000
&status=ACTIVE
&parent_location_id=null  // Racines uniquement
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "site_id": "660e8400-e29b-41d4-a716-446655440000",
        "parent_location_id": null,
        "name": "Archive Room 1",
        "code": "AR1",
        "location_type": "ROOM",
        "floor": "Basement",
        "building": "Building A",
        "temperature_controlled": true,
        "temperature_min": 18.0,
        "temperature_max": 22.0,
        "access_restricted": true,
        "capacity_cubic_meters": 50.0,
        "current_usage_percent": 75.5,
        "status": "ACTIVE",
        "children": [
          {
            "id": "bb0e8400-e29b-41d4-a716-446655440000",
            "name": "Zone A",
            "code": "AR1-ZA",
            "location_type": "ZONE",
            "containers_count": 8,
            "items_count": 450
          }
        ],
        "containers_count": 15,
        "items_count": 1230
      }
    ]
  }
}
```

---

#### POST /storage-locations

Créer nouvelle localisation.

**Request:**
```json
{
  "site_id": "660e8400-e29b-41d4-a716-446655440000",
  "parent_location_id": null,
  "name": "Archive Room 2",
  "code": "AR2",
  "location_type": "ROOM",
  "floor": "1",
  "building": "Building B",
  "temperature_controlled": false,
  "access_restricted": true,
  "capacity_cubic_meters": 35.0
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Storage location created successfully"
}
```

---

### 3.4 CONTENEURS

#### GET /containers

Liste conteneurs.

**Query Parameters:**
```
?location_id=aa0e8400-e29b-41d4-a716-446655440000
&container_type=CABINET
&status=ACTIVE
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cc0e8400-e29b-41d4-a716-446655440000",
        "location_id": "aa0e8400-e29b-41d4-a716-446655440000",
        "container_type": "CABINET",
        "name": "Cabinet A1",
        "code": "CAB-A1",
        "capacity_items": 500,
        "current_count": 387,
        "usage_percent": 77.4,
        "dimensions_cm": "120x60x180",
        "locked": true,
        "barcode": "CAB-A1-BAR123",
        "status": "ACTIVE"
      }
    ]
  }
}
```

---

#### POST /containers

Créer nouveau conteneur.

**Request:**
```json
{
  "location_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "container_type": "SHELF",
  "name": "Shelf B2",
  "code": "SHF-B2",
  "capacity_items": 200,
  "dimensions_cm": "100x40x30",
  "locked": false
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Container created successfully"
}
```

---

### 3.5 DOCUMENTS

#### GET /documents

Liste documents avec filtres avancés.

**Query Parameters:**
```
?study_id=770e8400-e29b-41d4-a716-446655440000
&site_id=660e8400-e29b-41d4-a716-446655440000
&document_type=CONSENT
&status=IN_STORAGE
&subject_id=SUBJ-001
&search=consent
&from_date=2026-01-01
&to_date=2026-12-31
&page=1
&page_size=50
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "dd0e8400-e29b-41d4-a716-446655440000",
        "study": {
          "protocol_number": "PROTO-2026-001",
          "title": "Phase III Study of Drug X"
        },
        "site": {
          "site_number": "001",
          "name": "CHU Paris"
        },
        "document_type": "CONSENT",
        "subject_id": "SUBJ-001",
        "visit_number": "V1",
        "form_name": "Informed Consent Form",
        "version": "2.0",
        "page_count": 8,
        "signature_required": true,
        "signed_date": "2026-01-20",
        "confidentiality_level": "HIGH",
        "status": "IN_STORAGE",
        "container": {
          "name": "Cabinet A1",
          "code": "CAB-A1"
        },
        "location": {
          "name": "Archive Room 1",
          "code": "AR1"
        },
        "rfid_tag": {
          "epc": "E2801170000001234567890A"
        },
        "storage_date": "2026-01-21",
        "expected_retention_until": "2036-01-21",
        "created_at": "2026-01-21T14:30:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST /documents

Enregistrer nouveau document.

**Request:**
```json
{
  "study_id": "770e8400-e29b-41d4-a716-446655440000",
  "site_id": "660e8400-e29b-41d4-a716-446655440000",
  "container_id": "cc0e8400-e29b-41d4-a716-446655440000",
  "document_type": "CRF",
  "subject_id": "SUBJ-015",
  "visit_number": "V3",
  "form_name": "Case Report Form - Visit 3",
  "version": "1.5",
  "page_count": 12,
  "signature_required": true,
  "signed_date": "2026-02-02",
  "confidentiality_level": "HIGH",
  "internal_code": "CRF-SUBJ015-V3",
  "description": "Completed CRF for subject 015, visit 3",
  "quantity": 1,
  "storage_date": "2026-02-03",
  "expected_retention_until": "2036-02-03",
  "physical_condition": "GOOD",
  "location_notes": "Top shelf, right side"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    ...
  },
  "message": "Document registered successfully"
}
```

---

#### GET /documents/{document_id}

Détails document.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    ... // Tous les champs du document
    "movements": [
      {
        "id": "...",
        "movement_type": "IN",
        "performed_by": {
          "name": "Jean Archiviste"
        },
        "movement_date": "2026-01-21T14:30:00Z",
        "notes": "Initial storage"
      }
    ],
    "access_requests": [
      {
        "id": "...",
        "request_number": "AR-2026-0005",
        "requester": {
          "name": "Sophie Moniteur"
        },
        "status": "APPROVED",
        "requested_at": "2026-01-25T09:00:00Z"
      }
    ]
  }
}
```

---

#### PUT /documents/{document_id}

Mettre à jour document.

**Request:**
```json
{
  "container_id": "ff0e8400-e29b-41d4-a716-446655440000",
  "physical_condition": "FAIR",
  "location_notes": "Moved to new cabinet"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Document updated successfully"
}
```

---

### 3.6 ÉQUIPEMENTS

#### GET /equipment

Liste équipements.

**Query Parameters:**
```
?study_id=...
&site_id=...
&equipment_type=CENTRIFUGE
&status=IN_STORAGE
&calibration_due_before=2026-03-31
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "gg0e8400-e29b-41d4-a716-446655440000",
        "study": { ... },
        "site": { ... },
        "equipment_type": "CENTRIFUGE",
        "manufacturer": "Eppendorf",
        "model": "5810R",
        "serial_number": "EPP-5810R-2025-12345",
        "calibration_required": true,
        "last_calibration_date": "2025-08-15",
        "next_calibration_date": "2026-08-15",
        "operational_status": "OPERATIONAL",
        "status": "IN_STORAGE",
        "container": { ... },
        "location": { ... },
        "rfid_tag": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST /equipment

Enregistrer nouvel équipement.

**Request:**
```json
{
  "study_id": "770e8400-e29b-41d4-a716-446655440000",
  "site_id": "660e8400-e29b-41d4-a716-446655440000",
  "container_id": "cc0e8400-e29b-41d4-a716-446655440000",
  "equipment_type": "REFRIGERATOR",
  "manufacturer": "Thermo Fisher",
  "model": "TSX Series",
  "serial_number": "TSX-2026-98765",
  "calibration_required": true,
  "next_calibration_date": "2027-01-01",
  "operational_status": "OPERATIONAL",
  "internal_code": "REFRIG-001",
  "description": "Laboratory refrigerator 2-8°C",
  "storage_date": "2026-02-03",
  "purchase_date": "2026-01-15",
  "purchase_cost": 3500.00,
  "currency": "EUR"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Equipment registered successfully"
}
```

---

### 3.7 CONSOMMABLES

#### GET /consumables

Liste consommables.

**Query Parameters:**
```
?study_id=...
&site_id=...
&consumable_type=REAGENT
&expiry_before=2026-06-30
&hazardous=true
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "hh0e8400-e29b-41d4-a716-446655440000",
        "study": { ... },
        "site": { ... },
        "consumable_type": "REAGENT",
        "manufacturer": "Sigma-Aldrich",
        "catalog_number": "SA-R-12345",
        "lot_number": "LOT2026A",
        "expiry_date": "2026-06-30",
        "storage_conditions": "2-8°C, protect from light",
        "hazardous": true,
        "hazard_classification": "H315, H319",
        "quantity": 10,
        "unit": "VIAL",
        "status": "IN_STORAGE",
        "container": { ... },
        "location": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST /consumables

Enregistrer nouveau consommable.

**Request:**
```json
{
  "study_id": "770e8400-e29b-41d4-a716-446655440000",
  "site_id": "660e8400-e29b-41d4-a716-446655440000",
  "container_id": "cc0e8400-e29b-41d4-a716-446655440000",
  "consumable_type": "TUBE",
  "manufacturer": "Greiner Bio-One",
  "catalog_number": "GBO-T-50ML",
  "lot_number": "LOT2026B",
  "expiry_date": "2028-12-31",
  "storage_conditions": "Room temperature",
  "hazardous": false,
  "quantity": 500,
  "unit": "PIECE",
  "internal_code": "TUBE-50ML-001",
  "description": "50ml conical tubes",
  "storage_date": "2026-02-03"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Consumable registered successfully"
}
```

---

### 3.8 RECHERCHE GLOBALE

#### GET /search

Recherche multi-entités.

**Query Parameters:**
```
?q=SUBJ-001
&types=document,equipment
&study_id=770e8400-e29b-41d4-a716-446655440000
&site_id=660e8400-e29b-41d4-a716-446655440000
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "documents": [
      { ... }
    ],
    "equipment": [
      { ... }
    ],
    "consumables": [],
    "total_results": 15
  }
}
```

---

## 4. RFID SERVICE (Port 8002)

### 4.1 POST /rfid/tags

Encoder nouveau tag RFID.

**Request:**
```json
{
  "associated_item_id": "dd0e8400-e29b-41d4-a716-446655440000",
  "associated_item_type": "DOCUMENT",
  "user_memory": {
    "study_id": "770e8400-e29b-41d4-a716-446655440000",
    "site_id": "660e8400-e29b-41d4-a716-446655440000",
    "item_type": "DOCUMENT"
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "ii0e8400-e29b-41d4-a716-446655440000",
    "epc": "E2801170000001234567890A",
    "tid": "E28011050000000000000001",
    "tag_type": "UHF_GEN2",
    "associated_item_id": "dd0e8400-e29b-41d4-a716-446655440000",
    "associated_item_type": "DOCUMENT",
    "encoding_date": "2026-02-03T10:30:00Z",
    "status": "ACTIVE"
  },
  "message": "RFID tag encoded successfully"
}
```

---

### 4.2 POST /rfid/read

Lire tag RFID.

**Request:**
```json
{
  "reader_id": "READER-001",
  "epc": "E2801170000001234567890A"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tag": {
      "id": "ii0e8400-e29b-41d4-a716-446655440000",
      "epc": "E2801170000001234567890A",
      "status": "ACTIVE"
    },
    "item": {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "type": "DOCUMENT",
      "document_type": "CONSENT",
      "subject_id": "SUBJ-001",
      "description": "Informed Consent Form",
      "status": "IN_STORAGE",
      "location": {
        "container": "Cabinet A1",
        "location": "Archive Room 1"
      }
    }
  }
}
```

---

### 4.3 GET /rfid/tags/{tag_id}

Détails tag RFID.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "ii0e8400-e29b-41d4-a716-446655440000",
    "epc": "E2801170000001234567890A",
    "tid": "E28011050000000000000001",
    "tag_type": "UHF_GEN2",
    "associated_item": {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "type": "DOCUMENT",
      "description": "Informed Consent Form"
    },
    "encoding_date": "2026-02-03T10:30:00Z",
    "last_read_date": "2026-02-03T15:45:00Z",
    "read_count": 12,
    "status": "ACTIVE"
  }
}
```

---

### 4.4 POST /rfid/bulk-read

Lecture multiple tags (inventaire).

**Request:**
```json
{
  "reader_id": "READER-001",
  "location_id": "aa0e8400-e29b-41d4-a716-446655440000",
  "epcs": [
    "E2801170000001234567890A",
    "E2801170000001234567890B",
    "E2801170000001234567890C"
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_tags_read": 3,
    "successful_reads": 3,
    "failed_reads": 0,
    "tags": [
      {
        "epc": "E2801170000001234567890A",
        "item": { ... }
      },
      {
        "epc": "E2801170000001234567890B",
        "item": { ... }
      },
      {
        "epc": "E2801170000001234567890C",
        "item": { ... }
      }
    ]
  }
}
```

---

## 5. WORKFLOW ENGINE (Port 8003)

### 5.1 DEMANDES D'ACCÈS

#### GET /access-requests

Liste demandes d'accès.

**Query Parameters:**
```
?status=PENDING
&requester_id=550e8400-e29b-41d4-a716-446655440000
&site_id=660e8400-e29b-41d4-a716-446655440000
&urgency=HIGH
&from_date=2026-02-01
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "jj0e8400-e29b-41d4-a716-446655440000",
        "request_number": "AR-2026-0042",
        "item": {
          "id": "dd0e8400-e29b-41d4-a716-446655440000",
          "type": "DOCUMENT",
          "description": "Informed Consent Form - SUBJ-001"
        },
        "requester": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "name": "Sophie Moniteur",
          "email": "sophie.moniteur@example.com"
        },
        "requester_site": {
          "site_number": "001",
          "name": "CHU Paris"
        },
        "request_type": "CONSULTATION",
        "purpose": "Monitoring visit - verification of source documents",
        "urgency": "HIGH",
        "status": "PENDING",
        "requested_at": "2026-02-03T09:00:00Z",
        "required_by_date": "2026-02-05",
        "hours_pending": 1.5
      }
    ],
    "pagination": { ... }
  }
}
```

---

#### POST /access-requests

Créer demande d'accès.

**Request:**
```json
{
  "stored_item_id": "dd0e8400-e29b-41d4-a716-446655440000",
  "requester_site_id": "660e8400-e29b-41d4-a716-446655440000",
  "request_type": "CONSULTATION",
  "purpose": "Monitoring visit - verification of source documents",
  "urgency": "HIGH",
  "required_by_date": "2026-02-05"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "request_number": "AR-2026-0042",
    "status": "PENDING",
    ...
  },
  "message": "Access request created successfully. Notification sent to archivist."
}
```

---

#### PUT /access-requests/{request_id}/approve

Approuver demande.

**Request:**
```json
{
  "approved_duration_days": 7,
  "review_notes": "Approved for monitoring visit. Please return within 7 days."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "status": "APPROVED",
    "reviewed_by": {
      "name": "Jean Archiviste"
    },
    "reviewed_at": "2026-02-03T10:30:00Z",
    "approved_duration_days": 7,
    "expected_return_date": "2026-02-10"
  },
  "message": "Access request approved. Notification sent to requester."
}
```

---

#### PUT /access-requests/{request_id}/reject

Rejeter demande.

**Request:**
```json
{
  "review_notes": "Document currently in use by another monitor. Please request after Feb 15."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "status": "REJECTED",
    "reviewed_by": { ... },
    "reviewed_at": "2026-02-03T10:35:00Z"
  },
  "message": "Access request rejected. Notification sent to requester."
}
```

---

#### PUT /access-requests/{request_id}/fulfill

Marquer demande comme accomplie (item sorti).

**Request:**
```json
{
  "actual_access_date": "2026-02-03T11:00:00Z",
  "notes": "Document handed to Sophie Moniteur"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "status": "FULFILLED",
    "actual_access_date": "2026-02-03T11:00:00Z",
    "expected_return_date": "2026-02-10"
  },
  "message": "Access request fulfilled. Item marked as OUT."
}
```

---

#### PUT /access-requests/{request_id}/return

Enregistrer retour item.

**Request:**
```json
{
  "actual_return_date": "2026-02-09T14:00:00Z",
  "notes": "Document returned in good condition"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "status": "RETURNED",
    "actual_return_date": "2026-02-09T14:00:00Z",
    "was_late": false
  },
  "message": "Item returned successfully. Access request closed."
}
```

---

#### PUT /access-requests/{request_id}/extend

Demander prolongation.

**Request:**
```json
{
  "extension_days": 7,
  "extension_reason": "Need additional time for thorough review"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "jj0e8400-e29b-41d4-a716-446655440000",
    "extension_requested": true,
    "extension_days": 7
  },
  "message": "Extension request submitted. Notification sent to archivist."
}
```

---

## 6. NOTIFICATION SERVICE (Port 8004)

### 6.1 GET /notifications

Liste notifications utilisateur.

**Query Parameters:**
```
?is_read=false
&notification_type=ACCESS_REQUEST
&from_date=2026-02-01
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "kk0e8400-e29b-41d4-a716-446655440000",
        "notification_type": "ACCESS_REQUEST",
        "title": "New Access Request",
        "message": "Sophie Moniteur requested access to document SUBJ-001 Consent",
        "priority": "HIGH",
        "is_read": false,
        "sent_at": "2026-02-03T09:00:00Z",
        "related_entity_type": "ACCESS_REQUEST",
        "related_entity_id": "jj0e8400-e29b-41d4-a716-446655440000"
      }
    ],
    "unread_count": 5,
    "pagination": { ... }
  }
}
```

---

### 6.2 PUT /notifications/{notification_id}/read

Marquer notification comme lue.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "kk0e8400-e29b-41d4-a716-446655440000",
    "is_read": true,
    "read_at": "2026-02-03T10:30:00Z"
  }
}
```

---

### 6.3 PUT /notifications/mark-all-read

Marquer toutes comme lues.

**Response 200:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "marked_count": 12
}
```

---

## 7. REPORTING SERVICE (Port 8005)

### 7.1 GET /reports/inventory

Rapport inventaire.

**Query Parameters:**
```
?study_id=770e8400-e29b-41d4-a716-446655440000
&site_id=660e8400-e29b-41d4-a716-446655440000
&format=pdf
&group_by=location
```

**Response 200 (PDF):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="inventory_report_2026-02-03.pdf"

[Binary PDF content]
```

---

### 7.2 GET /reports/movements

Rapport mouvements.

**Query Parameters:**
```
?study_id=...
&site_id=...
&from_date=2026-01-01
&to_date=2026-01-31
&format=excel
```

**Response 200 (Excel):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="movements_report_Jan2026.xlsx"

[Binary Excel content]
```

---

### 7.3 GET /reports/access-requests

Rapport demandes accès.

**Query Parameters:**
```
?status=OVERDUE
&from_date=2026-01-01
&to_date=2026-02-03
&format=csv
```

**Response 200 (CSV):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="access_requests_overdue.csv"

Request Number,Requester,Item,Expected Return,Days Overdue,Status
AR-2026-0023,John Doe,CONSENT-SUBJ005,2026-01-28,6,OVERDUE
...
```

---

### 7.4 GET /reports/audit-trail

Rapport piste d'audit.

**Query Parameters:**
```
?table_name=access_requests
&record_id=jj0e8400-e29b-41d4-a716-446655440000
&from_date=2026-01-01
&to_date=2026-02-03
&format=pdf
```

**Response 200 (PDF):**
Rapport détaillé de toutes les actions sur l'entité.

---

### 7.5 GET /reports/statistics

Statistiques globales.

**Query Parameters:**
```
?study_id=...
&site_id=...
&period=month
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-02-01",
      "end": "2026-02-03"
    },
    "inventory": {
      "total_documents": 1250,
      "total_equipment": 45,
      "total_consumables": 320,
      "total_items": 1615
    },
    "movements": {
      "entries": 85,
      "exits": 42,
      "returns": 38,
      "net_change": +43
    },
    "access_requests": {
      "total": 67,
      "pending": 12,
      "approved": 35,
      "rejected": 8,
      "fulfilled": 30,
      "overdue": 3,
      "average_approval_time_hours": 4.5
    },
    "storage_capacity": {
      "total_capacity": 5000,
      "current_usage": 3230,
      "usage_percent": 64.6,
      "locations_above_90_percent": 2
    },
    "alerts": {
      "calibration_due_soon": 3,
      "items_expiring_30_days": 8,
      "overdue_returns": 3
    }
  }
}
```

---

## 8. AUDIT SERVICE (Port 8006)

### 8.1 GET /audit-trail

Consultation audit trail.

**Query Parameters:**
```
?user_id=550e8400-e29b-41d4-a716-446655440000
&event_type=UPDATE
&table_name=access_requests
&from_timestamp=2026-02-01T00:00:00Z
&to_timestamp=2026-02-03T23:59:59Z
&page=1
&page_size=100
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "ll0e8400-e29b-41d4-a716-446655440000",
        "event_type": "UPDATE",
        "table_name": "access_requests",
        "record_id": "jj0e8400-e29b-41d4-a716-446655440000",
        "user": {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "username": "jean.archiviste",
          "full_name": "Jean Archiviste"
        },
        "action": "UPDATE",
        "old_values": {
          "status": "PENDING"
        },
        "new_values": {
          "status": "APPROVED",
          "approved_duration_days": 7
        },
        "ip_address": "192.168.1.45",
        "site_id": "660e8400-e29b-41d4-a716-446655440000",
        "timestamp": "2026-02-03T10:30:00Z",
        "hash_current": "a7b3c9d8e6f4a1b2c3d4e5f6g7h8i9j0"
      }
    ],
    "pagination": { ... }
  }
}
```

---

### 8.2 GET /audit-trail/verify-integrity

Vérifier intégrité chaîne audit.

**Query Parameters:**
```
?from_id=...
&to_id=...
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_records_checked": 1000,
    "integrity_valid": true,
    "broken_chain_detected": false,
    "details": {
      "first_record_id": "...",
      "last_record_id": "...",
      "verification_timestamp": "2026-02-03T11:00:00Z"
    }
  },
  "message": "Audit trail integrity verified successfully"
}
```

---

## 9. SYNCHRONISATION (Offline Support)

### 9.1 POST /sync/push

Envoyer modifications offline.

**Request:**
```json
{
  "actions": [
    {
      "action_type": "CREATE",
      "table_name": "documents",
      "client_timestamp": "2026-02-03T10:15:00Z",
      "payload": {
        "study_id": "...",
        "document_type": "CONSENT",
        ...
      }
    },
    {
      "action_type": "UPDATE",
      "table_name": "access_requests",
      "record_id": "jj0e8400-e29b-41d4-a716-446655440000",
      "client_timestamp": "2026-02-03T10:20:00Z",
      "payload": {
        "status": "APPROVED"
      }
    }
  ]
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_actions": 2,
    "successful": 1,
    "failed": 0,
    "conflicts": 1,
    "results": [
      {
        "action_index": 0,
        "status": "SUCCESS",
        "record_id": "mm0e8400-e29b-41d4-a716-446655440000"
      },
      {
        "action_index": 1,
        "status": "CONFLICT",
        "reason": "Record was modified by another user",
        "server_version": { ... },
        "client_version": { ... },
        "conflict_id": "nn0e8400-e29b-41d4-a716-446655440000"
      }
    ]
  }
}
```

---

### 9.2 GET /sync/pull

Récupérer modifications serveur.

**Query Parameters:**
```
?last_sync_timestamp=2026-02-03T09:00:00Z
&site_id=660e8400-e29b-41d4-a716-446655440000
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "table_name": "documents",
        "record_id": "dd0e8400-e29b-41d4-a716-446655440000",
        "change_type": "UPDATE",
        "timestamp": "2026-02-03T09:30:00Z",
        "data": { ... }
      },
      {
        "table_name": "access_requests",
        "record_id": "jj0e8400-e29b-41d4-a716-446655440000",
        "change_type": "UPDATE",
        "timestamp": "2026-02-03T10:30:00Z",
        "data": { ... }
      }
    ],
    "total_changes": 2,
    "server_timestamp": "2026-02-03T11:00:00Z"
  }
}
```

---

### 9.3 POST /sync/resolve-conflict

Résoudre conflit synchronisation.

**Request:**
```json
{
  "conflict_id": "nn0e8400-e29b-41d4-a716-446655440000",
  "resolution_strategy": "ACCEPT_SERVER",  // or ACCEPT_CLIENT, MERGE
  "merged_data": { ... }  // si MERGE
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "conflict_id": "nn0e8400-e29b-41d4-a716-446655440000",
    "resolution": "ACCEPT_SERVER",
    "final_record": { ... }
  },
  "message": "Conflict resolved successfully"
}
```

---

## 10. WEBHOOKS (Optionnel)

### 10.1 Configuration Webhooks

Permettre aux systèmes externes de s'abonner à des événements.

**Événements disponibles:**
- `access_request.created`
- `access_request.approved`
- `access_request.rejected`
- `access_request.overdue`
- `item.created`
- `item.updated`
- `movement.created`
- `alert.triggered`

**Payload exemple:**
```json
{
  "event": "access_request.approved",
  "timestamp": "2026-02-03T10:30:00Z",
  "data": {
    "request_id": "jj0e8400-e29b-41d4-a716-446655440000",
    "request_number": "AR-2026-0042",
    ...
  }
}
```

---

**Document créé le:** 2026-02-03  
**Version:** 1.0  
**Auteur:** API Architecture Team
