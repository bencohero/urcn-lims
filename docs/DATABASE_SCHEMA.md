# Schéma Base de Données - Clinical Storage System

## Vue d'ensemble

Base de données PostgreSQL 15+ avec structure relationnelle normalisée, audit trail complet, et support multi-tenancy partiel.

---

## 1. DIAGRAMME ERD (Entité-Relation)

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   STUDIES   │────┬───→│   SITES     │────────→│   USERS     │
└─────────────┘    │    └─────────────┘         └─────────────┘
                   │            │                       │
                   │            ↓                       ↓
                   │    ┌─────────────┐         ┌─────────────┐
                   │    │  SITE_USERS │         │    ROLES    │
                   │    └─────────────┘         └─────────────┘
                   │            
                   ↓            
           ┌─────────────┐     
           │  LOCATIONS  │     
           └─────────────┘     
                   │            
                   ↓            
           ┌─────────────┐     
           │ CONTAINERS  │     
           └─────────────┘     
                   │            
                   ↓            
           ┌─────────────┐         ┌─────────────┐
           │STORED_ITEMS │────────→│ RFID_TAGS   │
           └─────────────┘         └─────────────┘
                   │                       
                   ├──────────────┬────────────────┐
                   ↓              ↓                ↓
           ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
           │  DOCUMENTS  │ │  EQUIPMENT  │ │ CONSUMABLES │
           └─────────────┘ └─────────────┘ └─────────────┘
                   
           ┌─────────────┐         ┌─────────────┐
           │  MOVEMENTS  │────────→│ACCESS_REQUESTS│
           └─────────────┘         └─────────────┘
                   │                       │
                   ↓                       ↓
           ┌─────────────┐         ┌─────────────┐
           │ AUDIT_TRAIL │         │NOTIFICATIONS│
           └─────────────┘         └─────────────┘
```

---

## 2. TABLES PRINCIPALES

### 2.1 Table: users

Utilisateurs du système avec authentification et profils.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Argon2
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

### 2.2 Table: roles

Rôles système avec permissions RBAC.

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,  -- ADMIN, INVESTIGATOR, ARC, etc.
    description TEXT,
    permissions JSONB NOT NULL,  -- Structure permissions granulaires
    is_system_role BOOLEAN DEFAULT false,  -- Rôles prédéfinis non modifiables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exemple structure permissions JSONB:
-- {
--   "studies": {"create": true, "read": true, "update": true, "delete": false},
--   "documents": {"create": true, "read": true, "update": false, "delete": false},
--   "access_requests": {"create": true, "approve": false, "read": true}
-- }

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_permissions ON roles USING GIN(permissions);
```

---

### 2.3 Table: studies

Études cliniques.

```sql
CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    sponsor VARCHAR(255),
    phase VARCHAR(50),  -- Phase I, II, III, IV
    therapeutic_area VARCHAR(255),
    start_date DATE,
    end_date DATE,
    estimated_enrollment INTEGER,
    status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, PAUSED, COMPLETED, CANCELLED
    retention_period_years INTEGER DEFAULT 10,
    description TEXT,
    metadata JSONB,  -- Données additionnelles flexibles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_studies_protocol_number ON studies(protocol_number);
CREATE INDEX idx_studies_status ON studies(status);
CREATE INDEX idx_studies_start_date ON studies(start_date);
```

---

### 2.4 Table: sites

Sites cliniques associés aux études.

```sql
CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE RESTRICT,
    site_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT,
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    principal_investigator_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, CLOSED
    activation_date DATE,
    closure_date DATE,
    has_offline_capability BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'UTC',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(study_id, site_number)
);

CREATE INDEX idx_sites_study_id ON sites(study_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_country ON sites(country);
```

---

### 2.5 Table: site_users

Association utilisateurs ↔ sites avec rôles spécifiques.

```sql
CREATE TABLE site_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_primary BOOLEAN DEFAULT false,  -- Contact principal du site
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    
    UNIQUE(user_id, site_id, role_id)
);

CREATE INDEX idx_site_users_user_id ON site_users(user_id);
CREATE INDEX idx_site_users_site_id ON site_users(site_id);
CREATE INDEX idx_site_users_role_id ON site_users(role_id);
```

---

### 2.6 Table: storage_locations

Localisations physiques de stockage dans les sites.

```sql
CREATE TABLE storage_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    parent_location_id UUID REFERENCES storage_locations(id),  -- Hiérarchie
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),  -- Code court (ex: R1-A3)
    location_type VARCHAR(50) NOT NULL,  -- ROOM, ZONE, AREA
    description TEXT,
    floor VARCHAR(20),
    building VARCHAR(100),
    temperature_controlled BOOLEAN DEFAULT false,
    temperature_min DECIMAL(5,2),
    temperature_max DECIMAL(5,2),
    humidity_controlled BOOLEAN DEFAULT false,
    access_restricted BOOLEAN DEFAULT false,
    capacity_cubic_meters DECIMAL(10,2),
    current_usage_percent DECIMAL(5,2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, MAINTENANCE, CLOSED
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_storage_locations_site_id ON storage_locations(site_id);
CREATE INDEX idx_storage_locations_parent ON storage_locations(parent_location_id);
CREATE INDEX idx_storage_locations_status ON storage_locations(status);
CREATE INDEX idx_storage_locations_code ON storage_locations(code);
```

---

### 2.7 Table: containers

Conteneurs physiques (armoires, étagères, boîtes).

```sql
CREATE TABLE containers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES storage_locations(id) ON DELETE RESTRICT,
    parent_container_id UUID REFERENCES containers(id),  -- Conteneurs imbriqués
    container_type VARCHAR(50) NOT NULL,  -- CABINET, SHELF, DRAWER, BOX
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),  -- Code unique dans la localisation
    description TEXT,
    capacity_items INTEGER,
    current_count INTEGER DEFAULT 0,
    dimensions_cm VARCHAR(50),  -- Format: "LxWxH"
    material VARCHAR(100),
    locked BOOLEAN DEFAULT false,
    barcode VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_containers_location_id ON containers(location_id);
CREATE INDEX idx_containers_parent ON containers(parent_container_id);
CREATE INDEX idx_containers_status ON containers(status);
CREATE INDEX idx_containers_barcode ON containers(barcode);
```

---

### 2.8 Table: rfid_tags

Tags RFID physiques.

```sql
CREATE TABLE rfid_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    epc VARCHAR(255) UNIQUE NOT NULL,  -- Electronic Product Code
    tid VARCHAR(255) UNIQUE,  -- Tag Identifier (unique hardware)
    tag_type VARCHAR(50) DEFAULT 'UHF_GEN2',
    user_memory TEXT,  -- Données additionnelles encodées
    encoding_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_date TIMESTAMP WITH TIME ZONE,
    read_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'ACTIVE',  -- ACTIVE, DAMAGED, LOST, RETIRED
    associated_item_id UUID,  -- Generic reference
    associated_item_type VARCHAR(50),  -- DOCUMENT, EQUIPMENT, CONSUMABLE
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_rfid_tags_epc ON rfid_tags(epc);
CREATE INDEX idx_rfid_tags_tid ON rfid_tags(tid);
CREATE INDEX idx_rfid_tags_associated_item ON rfid_tags(associated_item_id, associated_item_type);
CREATE INDEX idx_rfid_tags_status ON rfid_tags(status);
```

---

### 2.9 Table: stored_items

Table mère pour tous les éléments stockés (approche héritage).

```sql
CREATE TABLE stored_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE RESTRICT,
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    container_id UUID REFERENCES containers(id) ON DELETE SET NULL,
    item_type VARCHAR(50) NOT NULL,  -- DOCUMENT, EQUIPMENT, CONSUMABLE
    internal_code VARCHAR(100),  -- Code interne organisation
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit VARCHAR(50),  -- UNIT, BOX, PACK
    status VARCHAR(50) DEFAULT 'IN_STORAGE',  -- IN_STORAGE, IN_USE, OUT, ARCHIVED, DESTROYED
    storage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_retention_until DATE,
    physical_condition VARCHAR(50) DEFAULT 'GOOD',  -- GOOD, FAIR, DAMAGED
    location_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_stored_items_study_id ON stored_items(study_id);
CREATE INDEX idx_stored_items_site_id ON stored_items(site_id);
CREATE INDEX idx_stored_items_container_id ON stored_items(container_id);
CREATE INDEX idx_stored_items_item_type ON stored_items(item_type);
CREATE INDEX idx_stored_items_status ON stored_items(status);
CREATE INDEX idx_stored_items_internal_code ON stored_items(internal_code);
```

---

### 2.10 Table: documents

Spécialisation pour documents (hérite de stored_items).

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY REFERENCES stored_items(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,  -- CONSENT, CRF, SOURCE_DOC, etc.
    subject_id VARCHAR(100),  -- ID patient/sujet
    visit_number VARCHAR(50),
    form_name VARCHAR(255),
    version VARCHAR(50),
    page_count INTEGER,
    original_language VARCHAR(10),
    signature_required BOOLEAN DEFAULT false,
    signed_date DATE,
    confidentiality_level VARCHAR(50) DEFAULT 'HIGH',  -- LOW, MEDIUM, HIGH, CRITICAL
    retention_category VARCHAR(100),  -- Catégorie règlementaire
    metadata JSONB
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_subject ON documents(subject_id);
CREATE INDEX idx_documents_confidentiality ON documents(confidentiality_level);
```

---

### 2.11 Table: equipment

Spécialisation pour équipements.

```sql
CREATE TABLE equipment (
    id UUID PRIMARY KEY REFERENCES stored_items(id) ON DELETE CASCADE,
    equipment_type VARCHAR(100) NOT NULL,  -- ANALYZER, CENTRIFUGE, REFRIGERATOR, etc.
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    calibration_required BOOLEAN DEFAULT false,
    last_calibration_date DATE,
    next_calibration_date DATE,
    maintenance_schedule VARCHAR(100),
    last_maintenance_date DATE,
    warranty_expiry_date DATE,
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'EUR',
    operational_status VARCHAR(50) DEFAULT 'OPERATIONAL',  -- OPERATIONAL, MAINTENANCE, DEFECTIVE, RETIRED
    metadata JSONB
);

CREATE INDEX idx_equipment_type ON equipment(equipment_type);
CREATE INDEX idx_equipment_serial ON equipment(serial_number);
CREATE INDEX idx_equipment_calibration_due ON equipment(next_calibration_date);
CREATE INDEX idx_equipment_operational_status ON equipment(operational_status);
```

---

### 2.12 Table: consumables

Spécialisation pour consommables.

```sql
CREATE TABLE consumables (
    id UUID PRIMARY KEY REFERENCES stored_items(id) ON DELETE CASCADE,
    consumable_type VARCHAR(100) NOT NULL,  -- REAGENT, TUBE, SYRINGE, etc.
    manufacturer VARCHAR(255),
    catalog_number VARCHAR(255),
    lot_number VARCHAR(255),
    expiry_date DATE,
    storage_conditions VARCHAR(255),  -- Ex: "2-8°C, protect from light"
    hazardous BOOLEAN DEFAULT false,
    hazard_classification VARCHAR(255),
    minimum_stock_level INTEGER,
    reorder_point INTEGER,
    metadata JSONB
);

CREATE INDEX idx_consumables_type ON consumables(consumable_type);
CREATE INDEX idx_consumables_lot ON consumables(lot_number);
CREATE INDEX idx_consumables_expiry ON consumables(expiry_date);
CREATE INDEX idx_consumables_hazardous ON consumables(hazardous);
```

---

### 2.13 Table: movements

Traçabilité des mouvements physiques.

```sql
CREATE TABLE movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stored_item_id UUID NOT NULL REFERENCES stored_items(id) ON DELETE RESTRICT,
    movement_type VARCHAR(50) NOT NULL,  -- IN, OUT, TRANSFER, RETURN, ARCHIVE, DESTROY
    from_container_id UUID REFERENCES containers(id),
    to_container_id UUID REFERENCES containers(id),
    from_location_id UUID REFERENCES storage_locations(id),
    to_location_id UUID REFERENCES storage_locations(id),
    quantity INTEGER DEFAULT 1,
    reason VARCHAR(255),
    related_access_request_id UUID,  -- Lien avec demande d'accès
    expected_return_date DATE,
    actual_return_date DATE,
    performed_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    movement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movements_item_id ON movements(stored_item_id);
CREATE INDEX idx_movements_type ON movements(movement_type);
CREATE INDEX idx_movements_date ON movements(movement_date);
CREATE INDEX idx_movements_performed_by ON movements(performed_by);
CREATE INDEX idx_movements_access_request ON movements(related_access_request_id);
```

---

### 2.14 Table: access_requests

Demandes d'accès aux documents/matériel.

```sql
CREATE TABLE access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number VARCHAR(100) UNIQUE NOT NULL,  -- Auto-generated: AR-2026-0001
    stored_item_id UUID NOT NULL REFERENCES stored_items(id) ON DELETE RESTRICT,
    requester_id UUID NOT NULL REFERENCES users(id),
    requester_site_id UUID NOT NULL REFERENCES sites(id),
    request_type VARCHAR(50) DEFAULT 'CONSULTATION',  -- CONSULTATION, COPY, LOAN
    purpose TEXT NOT NULL,
    urgency VARCHAR(50) DEFAULT 'NORMAL',  -- LOW, NORMAL, HIGH, CRITICAL
    status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, FULFILLED, CANCELLED, OVERDUE
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    required_by_date DATE,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    approved_duration_days INTEGER,  -- Durée approuvée en jours
    actual_access_date TIMESTAMP WITH TIME ZONE,
    expected_return_date DATE,
    actual_return_date DATE,
    extension_requested BOOLEAN DEFAULT false,
    extension_approved BOOLEAN,
    extension_days INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_access_requests_number ON access_requests(request_number);
CREATE INDEX idx_access_requests_item ON access_requests(stored_item_id);
CREATE INDEX idx_access_requests_requester ON access_requests(requester_id);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_access_requests_requested_at ON access_requests(requested_at);
CREATE INDEX idx_access_requests_overdue ON access_requests(expected_return_date) 
    WHERE status = 'FULFILLED' AND actual_return_date IS NULL;
```

---

### 2.15 Table: notifications

Notifications utilisateurs.

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,  -- ACCESS_REQUEST, APPROVAL, OVERDUE, ALERT, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL',  -- LOW, NORMAL, HIGH, CRITICAL
    channel VARCHAR(50) DEFAULT 'IN_APP',  -- IN_APP, EMAIL, SMS
    related_entity_type VARCHAR(50),  -- ACCESS_REQUEST, MOVEMENT, etc.
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_related ON notifications(related_entity_type, related_entity_id);
```

---

### 2.16 Table: audit_trail

Piste d'audit complète (immuable).

```sql
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,  -- CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    table_name VARCHAR(100),
    record_id UUID,
    user_id UUID REFERENCES users(id),
    username VARCHAR(100),  -- Dénormalisé pour historique
    user_full_name VARCHAR(255),  -- Dénormalisé
    action VARCHAR(255) NOT NULL,
    old_values JSONB,  -- Valeurs avant modification
    new_values JSONB,  -- Valeurs après modification
    ip_address INET,
    user_agent TEXT,
    site_id UUID REFERENCES sites(id),
    reason TEXT,  -- Raison de l'action (optionnel)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    session_id VARCHAR(255),
    hash_previous VARCHAR(64),  -- Hash enregistrement précédent (chaînage)
    hash_current VARCHAR(64) NOT NULL,  -- Hash enregistrement actuel (SHA-256)
    metadata JSONB
) PARTITION BY RANGE (timestamp);

-- Partitions par année pour performance
CREATE TABLE audit_trail_2026 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
    
CREATE TABLE audit_trail_2027 PARTITION OF audit_trail
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Indexes sur partitions
CREATE INDEX idx_audit_trail_2026_user ON audit_trail_2026(user_id);
CREATE INDEX idx_audit_trail_2026_timestamp ON audit_trail_2026(timestamp);
CREATE INDEX idx_audit_trail_2026_event_type ON audit_trail_2026(event_type);
CREATE INDEX idx_audit_trail_2026_table_record ON audit_trail_2026(table_name, record_id);

-- Trigger pour empêcher modifications/suppressions
CREATE OR REPLACE FUNCTION protect_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail is immutable. No updates or deletes allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_audit_trail_update
    BEFORE UPDATE OR DELETE ON audit_trail
    FOR EACH ROW EXECUTE FUNCTION protect_audit_trail();
```

---

### 2.17 Table: system_settings

Configuration système.

```sql
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,  -- GENERAL, SECURITY, NOTIFICATIONS, RFID, etc.
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(50) DEFAULT 'STRING',  -- STRING, INTEGER, BOOLEAN, JSON
    description TEXT,
    is_sensitive BOOLEAN DEFAULT false,  -- Chiffrer la valeur
    is_editable BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(category, setting_key)
);

CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Exemples de settings:
-- ('SECURITY', 'password_min_length', '12', 'INTEGER', ...)
-- ('SECURITY', 'session_timeout_minutes', '30', 'INTEGER', ...)
-- ('NOTIFICATIONS', 'approval_reminder_hours', '24', 'INTEGER', ...)
-- ('RFID', 'reader_timeout_seconds', '5', 'INTEGER', ...)
```

---

### 2.18 Table: sync_queue

File de synchronisation pour mode offline.

```sql
CREATE TABLE sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    site_id UUID REFERENCES sites(id),
    action_type VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    payload JSONB NOT NULL,  -- Données de l'action
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',  -- PENDING, PROCESSED, FAILED, CONFLICT
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    conflict_resolution VARCHAR(50),  -- LAST_WRITE_WINS, MANUAL, etc.
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_queue_user ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_timestamp ON sync_queue(client_timestamp);
CREATE INDEX idx_sync_queue_table_record ON sync_queue(table_name, record_id);
```

---

## 3. VUES UTILES

### 3.1 Vue: v_current_inventory

Inventaire actuel par site/localisation.

```sql
CREATE OR REPLACE VIEW v_current_inventory AS
SELECT 
    si.id,
    si.item_type,
    si.internal_code,
    si.description,
    si.status,
    si.quantity,
    st.protocol_number,
    st.title AS study_title,
    s.site_number,
    s.name AS site_name,
    sl.name AS location_name,
    c.name AS container_name,
    rt.epc AS rfid_tag,
    si.storage_date,
    si.expected_retention_until,
    CASE 
        WHEN si.item_type = 'DOCUMENT' THEN d.document_type
        WHEN si.item_type = 'EQUIPMENT' THEN e.equipment_type
        WHEN si.item_type = 'CONSUMABLE' THEN co.consumable_type
    END AS subtype,
    si.created_at
FROM stored_items si
JOIN studies st ON si.study_id = st.id
JOIN sites s ON si.site_id = s.id
LEFT JOIN containers c ON si.container_id = c.id
LEFT JOIN storage_locations sl ON c.location_id = sl.id
LEFT JOIN rfid_tags rt ON rt.associated_item_id = si.id
LEFT JOIN documents d ON d.id = si.id
LEFT JOIN equipment e ON e.id = si.id
LEFT JOIN consumables co ON co.id = si.id
WHERE si.status IN ('IN_STORAGE', 'IN_USE');
```

---

### 3.2 Vue: v_pending_access_requests

Demandes d'accès en attente.

```sql
CREATE OR REPLACE VIEW v_pending_access_requests AS
SELECT 
    ar.id,
    ar.request_number,
    ar.status,
    ar.urgency,
    u.username AS requester,
    u.first_name || ' ' || u.last_name AS requester_name,
    si.item_type,
    si.description AS item_description,
    st.protocol_number,
    s.site_number,
    ar.purpose,
    ar.requested_at,
    ar.required_by_date,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ar.requested_at))/3600 AS hours_pending
FROM access_requests ar
JOIN users u ON ar.requester_id = u.id
JOIN stored_items si ON ar.stored_item_id = si.id
JOIN studies st ON si.study_id = st.id
JOIN sites s ON ar.requester_site_id = s.id
WHERE ar.status = 'PENDING'
ORDER BY ar.urgency DESC, ar.requested_at ASC;
```

---

### 3.3 Vue: v_overdue_returns

Retours en retard.

```sql
CREATE OR REPLACE VIEW v_overdue_returns AS
SELECT 
    ar.id,
    ar.request_number,
    ar.expected_return_date,
    CURRENT_DATE - ar.expected_return_date AS days_overdue,
    u.username AS requester,
    u.email AS requester_email,
    si.item_type,
    si.description,
    st.protocol_number,
    s.site_number
FROM access_requests ar
JOIN users u ON ar.requester_id = u.id
JOIN stored_items si ON ar.stored_item_id = si.id
JOIN studies st ON si.study_id = st.id
JOIN sites s ON ar.requester_site_id = s.id
WHERE ar.status = 'FULFILLED'
  AND ar.actual_return_date IS NULL
  AND ar.expected_return_date < CURRENT_DATE;
```

---

### 3.4 Vue: v_storage_capacity

Capacité de stockage par localisation.

```sql
CREATE OR REPLACE VIEW v_storage_capacity AS
SELECT 
    sl.id,
    sl.name,
    sl.code,
    s.site_number,
    s.name AS site_name,
    COUNT(DISTINCT c.id) AS total_containers,
    COALESCE(SUM(c.capacity_items), 0) AS total_capacity,
    COALESCE(SUM(c.current_count), 0) AS current_usage,
    CASE 
        WHEN COALESCE(SUM(c.capacity_items), 0) > 0 
        THEN ROUND((COALESCE(SUM(c.current_count), 0)::DECIMAL / SUM(c.capacity_items)) * 100, 2)
        ELSE 0 
    END AS usage_percent
FROM storage_locations sl
JOIN sites s ON sl.site_id = s.id
LEFT JOIN containers c ON c.location_id = sl.id
WHERE sl.status = 'ACTIVE'
GROUP BY sl.id, sl.name, sl.code, s.site_number, s.name;
```

---

## 4. FONCTIONS & TRIGGERS

### 4.1 Fonction: Calcul hash audit trail

```sql
CREATE OR REPLACE FUNCTION calculate_audit_hash(
    p_event_type VARCHAR,
    p_table_name VARCHAR,
    p_record_id UUID,
    p_user_id UUID,
    p_action VARCHAR,
    p_old_values JSONB,
    p_new_values JSONB,
    p_timestamp TIMESTAMP WITH TIME ZONE,
    p_hash_previous VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_concatenated TEXT;
    v_hash VARCHAR;
BEGIN
    v_concatenated := CONCAT(
        COALESCE(p_event_type, ''),
        COALESCE(p_table_name, ''),
        COALESCE(p_record_id::TEXT, ''),
        COALESCE(p_user_id::TEXT, ''),
        COALESCE(p_action, ''),
        COALESCE(p_old_values::TEXT, ''),
        COALESCE(p_new_values::TEXT, ''),
        COALESCE(p_timestamp::TEXT, ''),
        COALESCE(p_hash_previous, '')
    );
    
    v_hash := encode(digest(v_concatenated, 'sha256'), 'hex');
    RETURN v_hash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

### 4.2 Trigger: Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables avec updated_at
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_studies_updated_at
    BEFORE UPDATE ON studies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ... répéter pour autres tables
```

---

### 4.3 Trigger: Audit trail automatique

```sql
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    v_event_type VARCHAR;
    v_old_values JSONB;
    v_new_values JSONB;
    v_hash_previous VARCHAR;
    v_hash_current VARCHAR;
BEGIN
    -- Déterminer le type d'événement
    IF TG_OP = 'INSERT' THEN
        v_event_type := 'CREATE';
        v_old_values := NULL;
        v_new_values := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'UPDATE' THEN
        v_event_type := 'UPDATE';
        v_old_values := row_to_json(OLD)::JSONB;
        v_new_values := row_to_json(NEW)::JSONB;
    ELSIF TG_OP = 'DELETE' THEN
        v_event_type := 'DELETE';
        v_old_values := row_to_json(OLD)::JSONB;
        v_new_values := NULL;
    END IF;
    
    -- Récupérer hash précédent
    SELECT hash_current INTO v_hash_previous
    FROM audit_trail
    ORDER BY timestamp DESC
    LIMIT 1;
    
    -- Calculer hash actuel
    v_hash_current := calculate_audit_hash(
        v_event_type,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.updated_by, OLD.updated_by, NEW.created_by),
        TG_OP,
        v_old_values,
        v_new_values,
        CURRENT_TIMESTAMP,
        v_hash_previous
    );
    
    -- Insérer dans audit_trail
    INSERT INTO audit_trail (
        event_type,
        table_name,
        record_id,
        user_id,
        action,
        old_values,
        new_values,
        hash_previous,
        hash_current
    ) VALUES (
        v_event_type,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.updated_by, OLD.updated_by, NEW.created_by),
        TG_OP,
        v_old_values,
        v_new_values,
        v_hash_previous,
        v_hash_current
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur tables critiques
CREATE TRIGGER tr_audit_stored_items
    AFTER INSERT OR UPDATE OR DELETE ON stored_items
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER tr_audit_access_requests
    AFTER INSERT OR UPDATE OR DELETE ON access_requests
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- ... répéter pour autres tables sensibles
```

---

### 4.4 Trigger: Auto-génération numéros demandes

```sql
CREATE OR REPLACE FUNCTION generate_access_request_number()
RETURNS TRIGGER AS $$
DECLARE
    v_year INTEGER;
    v_sequence INTEGER;
    v_request_number VARCHAR;
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Récupérer dernier numéro de l'année
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(request_number FROM 9) AS INTEGER)), 
        0
    ) + 1 INTO v_sequence
    FROM access_requests
    WHERE request_number LIKE 'AR-' || v_year || '-%';
    
    -- Générer numéro: AR-2026-0001
    v_request_number := 'AR-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
    
    NEW.request_number := v_request_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_access_request_number
    BEFORE INSERT ON access_requests
    FOR EACH ROW EXECUTE FUNCTION generate_access_request_number();
```

---

### 4.5 Trigger: Update container count

```sql
CREATE OR REPLACE FUNCTION update_container_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE containers
        SET current_count = (
            SELECT COUNT(*) FROM stored_items 
            WHERE container_id = NEW.container_id 
            AND status IN ('IN_STORAGE', 'IN_USE')
        )
        WHERE id = NEW.container_id;
    END IF;
    
    IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
        UPDATE containers
        SET current_count = (
            SELECT COUNT(*) FROM stored_items 
            WHERE container_id = OLD.container_id 
            AND status IN ('IN_STORAGE', 'IN_USE')
        )
        WHERE id = OLD.container_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_container_count
    AFTER INSERT OR UPDATE OR DELETE ON stored_items
    FOR EACH ROW EXECUTE FUNCTION update_container_count();
```

---

## 5. SEED DATA (Données initiales)

### 5.1 Rôles système

```sql
INSERT INTO roles (name, code, description, permissions, is_system_role) VALUES
('Administrateur Système', 'ADMIN', 'Accès complet système', 
 '{"*": {"create": true, "read": true, "update": true, "delete": true}}'::JSONB, true),

('Investigateur Principal', 'INVESTIGATOR', 'Responsable étude sur site',
 '{
   "studies": {"read": true},
   "sites": {"read": true},
   "documents": {"read": true},
   "equipment": {"read": true},
   "access_requests": {"create": true, "read": true}
 }'::JSONB, true),

('Attaché de Recherche Clinique', 'ARC', 'Gestion opérationnelle études',
 '{
   "studies": {"read": true, "update": true},
   "sites": {"read": true, "update": true},
   "documents": {"create": true, "read": true, "update": true},
   "equipment": {"create": true, "read": true, "update": true},
   "access_requests": {"create": true, "read": true, "update": true}
 }'::JSONB, true),

('Moniteur', 'MONITOR', 'Vérification conformité',
 '{
   "studies": {"read": true},
   "sites": {"read": true},
   "documents": {"read": true},
   "equipment": {"read": true},
   "access_requests": {"create": true, "read": true}
 }'::JSONB, true),

('Archiviste', 'ARCHIVIST', 'Gestion physique entreposage',
 '{
   "documents": {"create": true, "read": true, "update": true, "delete": false},
   "equipment": {"create": true, "read": true, "update": true, "delete": false},
   "consumables": {"create": true, "read": true, "update": true, "delete": false},
   "containers": {"create": true, "read": true, "update": true},
   "movements": {"create": true, "read": true},
   "access_requests": {"read": true, "approve": true},
   "rfid": {"read": true, "write": true}
 }'::JSONB, true),

('Data Manager', 'DATA_MANAGER', 'Gestion données et rapports',
 '{
   "studies": {"read": true},
   "sites": {"read": true},
   "documents": {"read": true},
   "reports": {"create": true, "read": true},
   "exports": {"create": true}
 }'::JSONB, true),

('Data Clerk', 'DATA_CLERK', 'Saisie données',
 '{
   "documents": {"create": true, "read": true},
   "equipment": {"create": true, "read": true},
   "consumables": {"create": true, "read": true}
 }'::JSONB, true);
```

---

### 5.2 Paramètres système

```sql
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description) VALUES
-- Sécurité
('SECURITY', 'password_min_length', '12', 'INTEGER', 'Longueur minimale mot de passe'),
('SECURITY', 'password_require_special', 'true', 'BOOLEAN', 'Caractère spécial requis'),
('SECURITY', 'session_timeout_minutes', '30', 'INTEGER', 'Timeout session inactivité'),
('SECURITY', 'max_login_attempts', '5', 'INTEGER', 'Tentatives login avant verrouillage'),
('SECURITY', 'lockout_duration_minutes', '30', 'INTEGER', 'Durée verrouillage compte'),

-- Notifications
('NOTIFICATIONS', 'approval_reminder_hours', '24', 'INTEGER', 'Rappel approbation si pas de réponse'),
('NOTIFICATIONS', 'return_reminder_days', '2', 'INTEGER', 'Rappel retour avant échéance'),
('NOTIFICATIONS', 'overdue_alert_hours', '12', 'INTEGER', 'Alerte retard après échéance'),

-- Workflows
('WORKFLOW', 'default_approval_duration_days', '7', 'INTEGER', 'Durée accès par défaut'),
('WORKFLOW', 'max_extension_days', '7', 'INTEGER', 'Prolongation max autorisée'),
('WORKFLOW', 'auto_close_fulfilled_days', '30', 'INTEGER', 'Clôture auto demandes accomplies'),

-- RFID
('RFID', 'reader_timeout_seconds', '5', 'INTEGER', 'Timeout lecture tag'),
('RFID', 'retry_failed_reads', '3', 'INTEGER', 'Tentatives relecture si échec'),

-- Stockage
('STORAGE', 'capacity_warning_percent', '90', 'INTEGER', 'Alerte capacité stockage'),
('STORAGE', 'default_retention_years', '10', 'INTEGER', 'Rétention par défaut');
```

---

## 6. INDEXES ADDITIONNELS POUR PERFORMANCE

```sql
-- Full-text search sur documents
CREATE INDEX idx_stored_items_description_fts 
    ON stored_items USING GIN(to_tsvector('english', description));

-- Recherche floue
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_stored_items_description_trgm 
    ON stored_items USING GIN(description gin_trgm_ops);

-- Indexes composites fréquents
CREATE INDEX idx_stored_items_study_site_status 
    ON stored_items(study_id, site_id, status);

CREATE INDEX idx_access_requests_site_status 
    ON access_requests(requester_site_id, status);

CREATE INDEX idx_movements_item_date 
    ON movements(stored_item_id, movement_date DESC);
```

---

## 7. POLITIQUES DE SÉCURITÉ (Row-Level Security - optionnel)

```sql
-- Activer RLS sur tables sensibles
ALTER TABLE stored_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Politique: Utilisateurs voient uniquement leurs sites
CREATE POLICY stored_items_site_policy ON stored_items
    FOR SELECT
    USING (
        site_id IN (
            SELECT site_id FROM site_users WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );

-- Politique: Demandes accessibles par site
CREATE POLICY access_requests_site_policy ON access_requests
    FOR SELECT
    USING (
        requester_site_id IN (
            SELECT site_id FROM site_users WHERE user_id = current_setting('app.current_user_id')::UUID
        )
    );
```

---

**Document créé le:** 2026-02-03  
**Version:** 1.0  
**Base de données:** PostgreSQL 15+
