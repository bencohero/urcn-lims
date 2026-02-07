# Architecture Système - Gestion Entreposage Documents & Matériel - Études Cliniques

## Vue d'ensemble

Système de gestion d'entreposage multi-sites pour documents physiques et matériel de laboratoire dans le cadre d'études cliniques, conforme GCP/ICH et RGPD.

---

## 1. ARCHITECTURE TECHNIQUE

### 1.1 Architecture Globale (3-Tiers)

```
┌─────────────────────────────────────────────────────────────┐
│                     COUCHE PRÉSENTATION                      │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   Web App      │  │  Mobile PWA    │  │ RFID Reader  │  │
│  │   (React.js)    │  │   (React.js)    │  │  Interface   │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    COUCHE APPLICATION                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Gateway (Nginx)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ▼                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Core API     │  │ Notification │     │
│  │ (FastAPI)    │  │ (FastAPI)    │  │ Service      │     │
│  │              │  │              │  │ (Celery)     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ RFID Service │  │ Workflow     │  │ Reporting    │     │
│  │ (FastAPI)    │  │ Engine       │  │ Service      │     │
│  │              │  │ (FastAPI)    │  │ (FastAPI)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      COUCHE DONNÉES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ PostgreSQL   │  │    Redis      │  │   MinIO      │     │
│  │ (Principal)  │  │   (Cache)     │  │  (Fichiers)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ PostgreSQL   │  │ Message Queue│                        │
│  │ (Réplica)    │  │  (RabbitMQ)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. COMPOSANTS PRINCIPAUX

### 2.1 Frontend (Next.js)

**Technologies:**
- Next.js 14+ (App Router)
- TypeScript
- React Query (TanStack Query)
- Zustand (État global)
- Tailwind CSS + shadcn/ui
- IndexedDB (Dexie.js) pour offline
- Service Worker (PWA)

**Modules:**
```
/app
├── /dashboard              # Tableaux de bord
├── /studies                # Gestion études
├── /storage                # Gestion entreposage
│   ├── /locations          # Localisations
│   ├── /inventory          # Inventaire
│   └── /movements          # Mouvements
├── /access-requests        # Demandes d'accès
├── /reports                # Rapports
├── /rfid                   # Interface RFID
└── /admin                  # Administration
```

**Mode Offline:**
- Service Worker pour cache ressources
- IndexedDB pour données locales
- Queue de synchronisation
- Détection réseau automatique
- Interface de résolution conflits

---

### 2.2 Backend (Python/FastAPI)

**Architecture Microservices:**

#### A. Auth Service (Port 8000)
```python
Responsabilités:
- Authentification (JWT)
- Autorisation (RBAC)
- Gestion utilisateurs
- Sessions multi-sites
- SSO (optionnel futur)
```

#### B. Core API Service (Port 8001)
```python
Responsabilités:
- CRUD études, sites, localisations
- Gestion documents/matériel
- Inventaire
- Recherche et filtres
- Exports données
```

#### C. RFID Service (Port 8002)
```python
Responsabilités:
- Lecture tags RFID
- Association tag ↔ élément
- Encodage nouveaux tags
- Gestion lecteurs multiples
- Interface avec hardware RFID
```

#### D. Workflow Engine (Port 8003)
```python
Responsabilités:
- Demandes d'accès
- Approbations multi-niveaux
- États et transitions
- Règles métier
- Historique décisions
```

#### E. Notification Service (Port 8004)
```python
Responsabilités:
- Notifications temps réel (WebSocket)
- Emails (demandes, alertes)
- SMS (optionnel)
- Alertes système
- File d'attente messages
```

#### F. Reporting Service (Port 8005)
```python
Responsabilités:
- Génération rapports PDF
- Exports Excel/CSV
- Statistiques
- Tableaux de bord
- Rapports planifiés
```

#### G. Audit Service (Port 8006)
```python
Responsabilités:
- Enregistrement audit trail
- Intégrité données (hash)
- Consultation logs
- Rapports conformité
- Archivage logs
```

---

### 2.3 Base de Données (PostgreSQL)

**Configuration:**
- PostgreSQL 15+
- Master-Replica (réplication streaming)
- Partitionnement tables audit (par année)
- Indexes optimisés
- Full-text search

**Extensions:**
- pgcrypto (chiffrement)
- pg_trgm (recherche floue)
- uuid-ossp (UUID v4)
- pg_stat_statements (monitoring)

---

### 2.4 Cache & Queue (Redis + RabbitMQ)

**Redis:**
- Sessions utilisateurs
- Cache requêtes fréquentes
- Rate limiting
- Locks distribués

**RabbitMQ:**
- Queue tâches asynchrones
- Communication inter-services
- Retry automatique
- Dead letter queue

---

### 2.5 Stockage Fichiers (MinIO)

**Usage:**
- Photos tags RFID
- Documents scannés (optionnel futur)
- Rapports générés
- Backups

**Configuration:**
- Buckets par type de contenu
- Versioning activé
- Rétention 10 ans
- Chiffrement at-rest

---

## 3. SÉCURITÉ

### 3.1 Authentification & Autorisation

```
Mécanisme:
1. Login → JWT (Access Token 15min + Refresh Token 7j)
2. RBAC avec permissions granulaires
3. MFA optionnel (TOTP)
4. Politique mots de passe forte
5. Verrouillage après 5 tentatives
```

**Rôles & Permissions:**

| Rôle          | Permissions Principales                                    |
|---------------|-----------------------------------------------------------|
| Admin Système | Gestion complète, configuration                           |
| Investigateur | Consultation études dont responsable                      |
| ARC           | Gestion études assignées, consultation multi-sites        |
| Moniteur      | Demandes accès, consultation inventaire                   |
| Archiviste    | Enregistrement entrées/sorties, gestion physique          |
| Data Manager  | Rapports, exports, statistiques                           |
| Data Clerk    | Saisie données, consultation limitée                      |

### 3.2 Chiffrement

- TLS 1.3 pour communications
- Données sensibles chiffrées at-rest (AES-256)
- Hash mots de passe (Argon2)
- Tokens JWT signés (RS256)

### 3.3 RGPD

- Consentement explicite
- Droit à l'oubli (anonymisation)
- Export données personnelles
- Logs accès données
- Minimisation données

---

## 4. MODE OFFLINE - SYNCHRONISATION

### 4.1 Stratégie Offline-First

```javascript
Architecture PWA:
1. Service Worker intercepte requêtes
2. Cache-First pour ressources statiques
3. Network-First pour données dynamiques
4. Background Sync pour actions offline
```

### 4.2 Gestion Conflits

**Stratégie:**
1. Last-Write-Wins avec timestamp
2. Détection conflits automatique
3. Interface résolution manuelle si nécessaire
4. Logs toutes résolutions

**Cas d'usage:**
```
Scénario: Deux archivistes modifient localisation même document offline

Résolution:
1. Système détecte conflit au sync
2. Compare timestamps
3. Garde modification la plus récente
4. Notifie utilisateur conflit résolu
5. Archive version conflictuelle dans audit
```

---

## 5. WORKFLOW DEMANDES D'ACCÈS

### 5.1 Processus Standard

```
┌──────────────┐
│  DEMANDE     │  Moniteur crée demande
│  CRÉÉE       │  (document/matériel spécifique)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  EN ATTENTE  │  Notification → Archiviste site
│  APPROBATION │
└──────┬───────┘
       │
       ├─────► APPROUVÉE ──► ACCÈS ACCORDÉ ──► ÉLÉMENT SORTI
       │                                         │
       │                                         ▼
       │                                    ÉLÉMENT RETOURNÉ
       │                                         │
       │                                         ▼
       │                                    DEMANDE CLÔTURÉE
       │
       └─────► REFUSÉE ──► DEMANDE CLÔTURÉE
```

### 5.2 Règles Métier

1. **Délai approbation:** 24h max (alerte auto si dépassé)
2. **Durée accès:** Paramétrable par site (défaut 7j)
3. **Prolongation:** Possible 1 fois (+7j)
4. **Retour:** Alerte si non retourné après délai
5. **Traçabilité:** Chaque étape enregistrée (audit trail)

---

## 6. SYSTÈME RFID

### 6.1 Composants Hardware

**Lecteurs RFID:**
- Protocole: UHF Gen2 (EPC Class 1)
- Fréquence: 865-868 MHz (EU)
- Portée: 0-5m
- Interface: USB/Ethernet
- Positionnement: Entrées salles stockage + postes archivistes

**Tags RFID:**
- Type: Passifs UHF
- Mémoire: 512 bits minimum
- Encodage: EPC (96 bits) + User Memory
- Durabilité: 10 ans minimum
- Format: Étiquettes adhésives

### 6.2 Structure Données Tag

```
EPC (96 bits):
├── Header (8 bits): Type tag
├── Filter (3 bits): Catégorie (document/matériel)
├── Partition (3 bits): Répartition identifiants
├── Company Prefix (20-40 bits): ID organisation
├── Item Reference (24-44 bits): ID unique élément
└── Serial Number (36 bits): Numéro série

User Memory (custom):
├── Study ID (32 bits)
├── Site ID (16 bits)
├── Type (8 bits): DOC/EQUIP/CONS
└── Checksum (16 bits)
```

### 6.3 Workflow Enregistrement

```
1. Archiviste scanne nouveau document/matériel
2. Système génère ID unique
3. Encodage tag RFID
4. Association tag ↔ élément dans BDD
5. Placement physique dans localisation
6. Confirmation enregistrement
```

---

## 7. ALERTES & NOTIFICATIONS

### 7.1 Types d'Alertes

| Type                        | Déclencheur                           | Destinataires         |
|----------------------------|---------------------------------------|-----------------------|
| Demande accès              | Nouvelle demande créée                | Archiviste site       |
| Approbation tardive        | Demande > 24h sans réponse            | Archiviste + Manager  |
| Retour tardif              | Délai retour dépassé                  | Demandeur + Archiviste|
| Capacité stockage          | Localisation > 90% pleine             | Archiviste + Admin    |
| Échec synchronisation      | Offline > 48h                         | Admin système         |
| Activité suspecte          | Tentatives accès non autorisé         | Admin sécurité        |
| Tag RFID non lisible       | Échec lecture > 3 fois                | Archiviste            |

### 7.2 Canaux

1. **In-app:** Notifications temps réel (WebSocket)
2. **Email:** Alertes importantes
3. **SMS:** Critiques uniquement (optionnel)
4. **Dashboard:** Centre de notifications

---

## 8. RAPPORTS & ANALYTICS

### 8.1 Rapports Standard

1. **Inventaire complet** (par étude/site)
2. **Mouvements** (entrées/sorties période)
3. **Demandes accès** (statuts, délais)
4. **Audit trail** (toutes actions utilisateur)
5. **Taux occupation** (capacités stockage)
6. **Performance SLA** (délais approbation/retour)

### 8.2 Formats Export

- PDF (rapports officiels)
- Excel (analyses)
- CSV (données brutes)
- JSON (API)

---

## 9. DÉPLOIEMENT ON-PREMISE

### 9.1 Infrastructure Minimale

```
Serveur Principal:
- CPU: 16 cores
- RAM: 64 GB
- Stockage: 2 TB SSD (RAID 10)
- Réseau: 10 Gbps
- OS: Ubuntu 22.04 LTS

Serveur Réplica (Haute Dispo):
- CPU: 16 cores
- RAM: 64 GB
- Stockage: 2 TB SSD
- Réseau: 10 Gbps

NAS Backup:
- Stockage: 10 TB
- RAID 6
- Backup automatique quotidien
```

### 9.2 Conteneurisation (Docker)

```yaml
Services:
- nginx (reverse proxy)
- auth-service (Python/FastAPI)
- core-api (Python/FastAPI)
- rfid-service (Python/FastAPI)
- workflow-engine (Python/FastAPI)
- notification-service (Python/FastAPI + Celery)
- reporting-service (Python/FastAPI)
- audit-service (Python/FastAPI)
- postgresql-master
- postgresql-replica
- redis
- rabbitmq
- minio
- frontend (React.js)
```

### 9.3 Orchestration

**Option 1: Docker Compose** (recommandé pour début)
- Simple à déployer
- Gestion multi-conteneurs
- Scaling limité

**Option 2: Kubernetes** (si scaling important futur)
- Haute disponibilité
- Auto-scaling
- Gestion complexe

---

## 10. MONITORING & MAINTENANCE

### 10.1 Monitoring

**Outils:**
- Prometheus (métriques)
- Grafana (dashboards)
- Loki (logs centralisés)
- Uptime Kuma (health checks)

**Métriques Clés:**
- CPU/RAM/Disque
- Temps réponse API
- Taux erreurs
- Connexions actives
- Queue messages
- Réplication BDD

### 10.2 Backups

```
Stratégie 3-2-1:
- 3 copies données
- 2 supports différents (SSD + NAS)
- 1 copie off-site (bande magnétique)

Fréquence:
- BDD: Backup incrémental quotidien
- BDD: Backup complet hebdomadaire
- Fichiers: Backup quotidien
- Rétention: 10 ans (conformité)
```

### 10.3 Plan Reprise Activité (PRA)

**RTO:** 4 heures
**RPO:** 24 heures

**Procédure:**
1. Détection panne
2. Bascule sur réplica
3. Restauration données dernière sauvegarde
4. Tests intégrité
5. Reprise service

---

## 11. SCALABILITÉ

### 11.1 Croissance Attendue

```
Année 1: 7 sites, 400 utilisateurs
Année 3: 15 sites, 1000 utilisateurs
Année 5: 25 sites, 2000 utilisateurs
```

### 11.2 Points Scaling

1. **Horizontal:** Réplicas lecture PostgreSQL
2. **API:** Load balancing multi-instances FastAPI
3. **Cache:** Redis Cluster
4. **Stockage:** MinIO distributed mode
5. **Frontend:** CDN pour assets statiques

---

## 12. CONFORMITÉ & AUDIT

### 12.1 GCP/ICH Compliance

- Validation système (IQ/OQ/PQ)
- SOP (Standard Operating Procedures)
- Training utilisateurs
- Change control process
- Disaster recovery plan

### 12.2 Audit Trail Requis

**Chaque action enregistre:**
- User ID + Nom complet
- Action effectuée (CRUD)
- Timestamp précis (UTC)
- Données avant/après
- Adresse IP
- Site/Localisation
- Raison (optionnel)
- Hash SHA-256 (intégrité)

**Inaltérabilité:**
- Table audit append-only
- Triggers BDD empêchent UPDATE/DELETE
- Hash chaîné (blockchain-like)
- Export périodique sécurisé

---

## 13. ROADMAP IMPLÉMENTATION

### Phase 1 - MVP (3 mois)
- [ ] Architecture BDD
- [ ] Auth Service + Core API
- [ ] Frontend base (études, sites, utilisateurs)
- [ ] Gestion localisations stockage
- [ ] CRUD documents/matériel (sans RFID)
- [ ] Audit trail basique

### Phase 2 - Workflows (2 mois)
- [ ] Workflow demandes accès
- [ ] Notifications email
- [ ] Rapports basiques
- [ ] Tests utilisateurs

### Phase 3 - RFID (2 mois)
- [ ] RFID Service
- [ ] Intégration lecteurs
- [ ] Encodage tags
- [ ] Interface scan

### Phase 4 - Offline (2 mois)
- [ ] PWA
- [ ] Mode offline complet
- [ ] Synchronisation
- [ ] Gestion conflits

### Phase 5 - Advanced (2 mois)
- [ ] Analytics avancés
- [ ] Alertes intelligentes
- [ ] Optimisations performance
- [ ] Formation utilisateurs

---

## 14. COÛTS ESTIMÉS

### 14.1 Infrastructure On-Premise

| Élément                  | Coût Estimé      |
|--------------------------|------------------|
| Serveurs (2x)            | 15 000 €         |
| NAS Backup               | 5 000 €          |
| Lecteurs RFID (10x)      | 8 000 €          |
| Tags RFID (10 000x)      | 2 000 €          |
| Licences logicielles     | 0 € (Open Source)|
| Installation réseau      | 3 000 €          |
| **TOTAL Initial**        | **33 000 €**     |

### 14.2 Développement

| Phase                    | Durée    | Coût Estimé      |
|--------------------------|----------|------------------|
| Phase 1 (MVP)            | 3 mois   | 45 000 €         |
| Phase 2 (Workflows)      | 2 mois   | 30 000 €         |
| Phase 3 (RFID)           | 2 mois   | 30 000 €         |
| Phase 4 (Offline)        | 2 mois   | 30 000 €         |
| Phase 5 (Advanced)       | 2 mois   | 30 000 €         |
| **TOTAL Développement**  | **11 mois** | **165 000 €** |

### 14.3 Maintenance Annuelle

- Support & maintenance: 20 000 €/an
- Électricité & infrastructure: 5 000 €/an
- Évolutions: 15 000 €/an

---

## PROCHAINES ÉTAPES

1. **Validation architecture** avec parties prenantes
2. **Schéma base de données détaillé**
3. **API specifications (OpenAPI)**
4. **Maquettes UI/UX**
5. **Plan de tests**
6. **Sélection hardware RFID**

---

**Document créé le:** 2026-02-03  
**Version:** 1.0  
**Auteur:** Architecture Team
