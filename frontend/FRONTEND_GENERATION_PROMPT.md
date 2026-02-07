# 🚀 Prompt pour Générer le Frontend Complet - Clinical Storage System

## Prompt Principal pour Claude Code

```markdown
# MISSION : Générer le Frontend React Complet - Clinical Storage System

## Contexte
Je veux créer l'application frontend React complète du Clinical Storage System pour la gestion d'entreposage clinique multi-sites.

**Avant de commencer, lis attentivement ces documents :**
1. `/docs/REACT_ARCHITECTURE.md` - Architecture React complète
2. `/docs/UI_MOCKUPS.md` - Maquettes des 12 écrans
3. `/docs/API_SPECIFICATIONS.md` - Endpoints API à consommer
4. `/docs/USER_GUIDE.md` - Fonctionnalités utilisateur détaillées
5. `/clinical-storage-frontend/README.md` - Guide technique frontend

## Architecture Cible

### Stack Technique
- **React 18** avec hooks
- **Vite 5** comme build tool
- **React Router v6** pour le routing
- **Zustand** pour l'état global
- **React Query** pour le cache API
- **Tailwind CSS** pour le styling
- **Radix UI** pour les composants UI
- **React Hook Form + Zod** pour les formulaires
- **Dexie.js** pour IndexedDB (offline)
- **Axios** pour les appels API
- **Vitest + Testing Library** pour les tests

### Structure Complète à Générer

```
clinical-storage-frontend/
├── public/
│   ├── index.html                   # ✅ Déjà créé
│   ├── manifest.json                # ✅ Déjà créé
│   ├── service-worker.js            # À CRÉER
│   ├── robots.txt                   # À CRÉER
│   └── icons/                       # À CRÉER (8 tailles)
│
├── src/
│   ├── main.jsx                     # ✅ Déjà créé
│   ├── router.jsx                   # ✅ Déjà créé
│   │
│   ├── components/
│   │   ├── ui/                      # 15 composants UI de base
│   │   │   ├── Button.jsx           # ✅ Déjà créé
│   │   │   ├── Input.jsx            # À CRÉER
│   │   │   ├── Select.jsx           # À CRÉER
│   │   │   ├── Textarea.jsx         # À CRÉER
│   │   │   ├── Checkbox.jsx         # À CRÉER
│   │   │   ├── Radio.jsx            # À CRÉER
│   │   │   ├── Switch.jsx           # À CRÉER
│   │   │   ├── Label.jsx            # À CRÉER
│   │   │   ├── Modal.jsx            # À CRÉER
│   │   │   ├── Dialog.jsx           # À CRÉER
│   │   │   ├── Dropdown.jsx         # À CRÉER
│   │   │   ├── Tabs.jsx             # À CRÉER
│   │   │   ├── Table.jsx            # À CRÉER
│   │   │   ├── Badge.jsx            # À CRÉER
│   │   │   ├── Toast.jsx            # À CRÉER
│   │   │   ├── Spinner.jsx          # À CRÉER
│   │   │   ├── Avatar.jsx           # À CRÉER
│   │   │   ├── Card.jsx             # À CRÉER
│   │   │   └── Pagination.jsx       # À CRÉER
│   │   │
│   │   ├── layout/                  # Composants layout
│   │   │   ├── MainLayout.jsx       # À CRÉER
│   │   │   ├── Sidebar.jsx          # À CRÉER
│   │   │   ├── Header.jsx           # À CRÉER
│   │   │   ├── Footer.jsx           # À CRÉER
│   │   │   ├── Breadcrumb.jsx       # À CRÉER
│   │   │   └── PageHeader.jsx       # À CRÉER
│   │   │
│   │   ├── features/                # Composants métier
│   │   │   ├── documents/
│   │   │   │   ├── DocumentsList.jsx
│   │   │   │   ├── DocumentsTable.jsx
│   │   │   │   ├── DocumentsFilters.jsx
│   │   │   │   ├── DocumentDetails.jsx
│   │   │   │   ├── DocumentForm.jsx
│   │   │   │   ├── DocumentCard.jsx
│   │   │   │   └── DocumentHistory.jsx
│   │   │   ├── equipment/
│   │   │   │   ├── EquipmentList.jsx
│   │   │   │   ├── EquipmentTable.jsx
│   │   │   │   ├── EquipmentFilters.jsx
│   │   │   │   ├── EquipmentDetails.jsx
│   │   │   │   ├── EquipmentForm.jsx
│   │   │   │   └── CalibrationAlert.jsx
│   │   │   ├── consumables/
│   │   │   │   ├── ConsumablesList.jsx
│   │   │   │   ├── ConsumablesTable.jsx
│   │   │   │   ├── ConsumablesFilters.jsx
│   │   │   │   ├── ConsumableDetails.jsx
│   │   │   │   ├── ConsumableForm.jsx
│   │   │   │   └── StockAlert.jsx
│   │   │   ├── access-requests/
│   │   │   │   ├── AccessRequestsList.jsx
│   │   │   │   ├── AccessRequestsTable.jsx
│   │   │   │   ├── AccessRequestsFilters.jsx
│   │   │   │   ├── AccessRequestDetails.jsx
│   │   │   │   ├── AccessRequestForm.jsx
│   │   │   │   ├── ApprovalPanel.jsx
│   │   │   │   └── WorkflowTimeline.jsx
│   │   │   ├── rfid/
│   │   │   │   ├── RFIDScanner.jsx
│   │   │   │   ├── TagEncoder.jsx
│   │   │   │   ├── TagReader.jsx
│   │   │   │   ├── BulkInventory.jsx
│   │   │   │   └── TagHistory.jsx
│   │   │   ├── reports/
│   │   │   │   ├── ReportGenerator.jsx
│   │   │   │   ├── ReportFilters.jsx
│   │   │   │   ├── ReportPreview.jsx
│   │   │   │   ├── ScheduledReports.jsx
│   │   │   │   └── ReportHistory.jsx
│   │   │   ├── admin/
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── UserForm.jsx
│   │   │   │   ├── RoleManagement.jsx
│   │   │   │   ├── PermissionsEditor.jsx
│   │   │   │   ├── SystemSettings.jsx
│   │   │   │   └── AuditTrailViewer.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   ├── CapacityChart.jsx
│   │   │   │   ├── ActivityChart.jsx
│   │   │   │   ├── AlertsWidget.jsx
│   │   │   │   ├── RecentActivity.jsx
│   │   │   │   └── QuickActions.jsx
│   │   │   └── shared/
│   │   │       ├── SearchBar.jsx
│   │   │       ├── NotificationCenter.jsx
│   │   │       ├── OfflineBanner.jsx
│   │   │       ├── SyncIndicator.jsx
│   │   │       ├── LoadingScreen.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       └── ErrorMessage.jsx
│   │   │
│   │   └── ErrorBoundary.jsx        # À CRÉER
│   │
│   ├── pages/                       # 12 pages principales
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx        # À CRÉER
│   │   │   └── ForgotPasswordPage.jsx # À CRÉER
│   │   ├── DashboardPage.jsx        # À CRÉER
│   │   ├── documents/
│   │   │   ├── DocumentsListPage.jsx    # À CRÉER
│   │   │   └── DocumentDetailsPage.jsx  # À CRÉER
│   │   ├── equipment/
│   │   │   ├── EquipmentListPage.jsx    # À CRÉER
│   │   │   └── EquipmentDetailsPage.jsx # À CRÉER
│   │   ├── consumables/
│   │   │   ├── ConsumablesListPage.jsx  # À CRÉER
│   │   │   └── ConsumableDetailsPage.jsx # À CRÉER
│   │   ├── access-requests/
│   │   │   ├── AccessRequestsPage.jsx   # À CRÉER
│   │   │   └── AccessRequestDetailsPage.jsx # À CRÉER
│   │   ├── rfid/
│   │   │   └── RFIDPage.jsx         # À CRÉER
│   │   ├── reports/
│   │   │   └── ReportsPage.jsx      # À CRÉER
│   │   ├── admin/
│   │   │   └── AdminPage.jsx        # À CRÉER
│   │   └── NotFoundPage.jsx         # À CRÉER
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.js               # À CRÉER
│   │   ├── useDocuments.js          # À CRÉER
│   │   ├── useEquipment.js          # À CRÉER
│   │   ├── useConsumables.js        # À CRÉER
│   │   ├── useAccessRequests.js     # À CRÉER
│   │   ├── useRFID.js               # À CRÉER
│   │   ├── useReports.js            # À CRÉER
│   │   ├── useNotifications.js      # À CRÉER
│   │   ├── useOfflineSync.js        # À CRÉER
│   │   ├── useWebSocket.js          # À CRÉER
│   │   ├── useDebounce.js           # À CRÉER
│   │   ├── useLocalStorage.js       # À CRÉER
│   │   └── useMediaQuery.js         # À CRÉER
│   │
│   ├── lib/
│   │   ├── api/                     # API clients
│   │   │   ├── client.js            # ✅ Déjà créé
│   │   │   ├── auth.js              # ✅ Déjà créé
│   │   │   ├── documents.js         # ✅ Déjà créé
│   │   │   ├── equipment.js         # À CRÉER
│   │   │   ├── consumables.js       # À CRÉER
│   │   │   ├── accessRequests.js    # À CRÉER
│   │   │   ├── rfid.js              # À CRÉER
│   │   │   ├── reports.js           # À CRÉER
│   │   │   ├── notifications.js     # À CRÉER
│   │   │   ├── users.js             # À CRÉER
│   │   │   ├── studies.js           # À CRÉER
│   │   │   └── sites.js             # À CRÉER
│   │   ├── db/                      # IndexedDB (Offline)
│   │   │   ├── schema.js            # À CRÉER
│   │   │   ├── sync.js              # À CRÉER
│   │   │   └── conflicts.js         # À CRÉER
│   │   ├── utils/                   # Utilitaires
│   │   │   ├── validators.js        # À CRÉER
│   │   │   ├── formatters.js        # À CRÉER
│   │   │   └── constants.js         # À CRÉER
│   │   ├── queryClient.js           # ✅ Déjà créé
│   │   └── utils.js                 # ✅ Déjà créé
│   │
│   ├── store/                       # Zustand stores
│   │   ├── authStore.js             # ✅ Déjà créé
│   │   ├── uiStore.js               # ✅ Déjà créé
│   │   └── offlineStore.js          # ✅ Déjà créé
│   │
│   ├── routes/                      # Route guards
│   │   ├── ProtectedRoute.jsx       # ✅ Déjà créé
│   │   └── RoleBasedRoute.jsx       # ✅ Déjà créé
│   │
│   ├── styles/
│   │   └── index.css                # ✅ Déjà créé
│   │
│   └── types/                       # Types (JSDoc ou TypeScript)
│       └── index.js                 # À CRÉER
│
├── tests/                           # Tests
│   ├── setup.js                     # À CRÉER
│   ├── components/
│   │   ├── ui/
│   │   │   └── Button.test.jsx
│   │   └── features/
│   │       └── documents/
│   │           └── DocumentsTable.test.jsx
│   ├── pages/
│   │   └── LoginPage.test.jsx
│   ├── hooks/
│   │   └── useDocuments.test.js
│   └── integration/
│       └── workflow.test.jsx
│
├── .env.example                     # ✅ Déjà créé
├── .env.local                       # À CRÉER (copie de .env.example)
├── .gitignore                       # À CRÉER
├── .eslintrc.js                     # À CRÉER
├── .prettierrc                      # À CRÉER
├── package.json                     # ✅ Déjà créé
├── vite.config.js                   # ✅ Déjà créé
├── tailwind.config.js               # ✅ Déjà créé
├── postcss.config.js                # À CRÉER
├── vitest.config.js                 # À CRÉER
└── README.md                        # ✅ Déjà créé
```

## Tâches à Exécuter

### Phase 1 : Composants UI de Base (15 composants)

Pour CHAQUE composant UI, crée dans `src/components/ui/` :

**1.1 Input.jsx**
```jsx
Composant Input avec :
- Variantes : text, password, email, number, search
- Support react-hook-form (forwardRef)
- États : default, error, disabled, success
- Icons à gauche/droite (via prop)
- Tailles : sm, md, lg
- Tailwind styling
- Accessibilité (aria-label, aria-invalid, aria-describedby)
- Message d'erreur intégré

Props : name, type, placeholder, error, icon, iconPosition, size, disabled, ...rest

Référence : Button.jsx pour le pattern
```

**1.2 Select.jsx**
```jsx
Composant Select avec :
- Support react-hook-form
- Options array [{value, label}]
- Recherche intégrée (optionnel)
- Multi-select (optionnel)
- Loading state
- Empty state
- Accessibilité complète
- Tailwind styling

Utilise Radix UI Select comme base
```

**1.3 Modal.jsx**
```jsx
Composant Modal avec :
- Open/close animations
- Overlay backdrop
- Fermeture ESC
- Fermeture click outside
- Tailles : sm, md, lg, xl, full
- Header, Body, Footer slots
- Scroll body si contenu long
- Focus trap
- Accessibilité (aria-modal, role="dialog")

Utilise Radix UI Dialog
```

**1.4 Table.jsx**
```jsx
Composant Table avec :
- Colonnes configurables [{key, label, render, sortable}]
- Tri par colonne (client-side)
- Pagination intégrée
- Loading skeleton
- Empty state
- Row selection (checkbox)
- Row actions (menu dropdown)
- Responsive (scroll horizontal mobile)
- Sticky header
- Zebra striping (optionnel)

Props : columns, data, isLoading, onRowClick, onSort, pagination, onPageChange
```

**1.5 Toast.jsx**
```jsx
Système Toast/Notifications avec :
- Types : success, error, warning, info
- Position : top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
- Auto-dismiss (temps configurable)
- Fermeture manuelle
- Actions (boutons)
- Stack multiple toasts
- Animations enter/exit
- Icons automatiques selon type

Utilise Radix UI Toast
Export : toast.success(), toast.error(), toast.warning(), toast.info()
```

**Continuer pour :**
- Textarea.jsx
- Checkbox.jsx
- Radio.jsx
- Switch.jsx
- Label.jsx
- Dialog.jsx (confirmations)
- Dropdown.jsx
- Tabs.jsx
- Badge.jsx
- Spinner.jsx
- Avatar.jsx
- Card.jsx
- Pagination.jsx

**Standards pour tous les composants UI :**
- Utiliser forwardRef si nécessaire (formulaires)
- Props TypeScript-style avec JSDoc
- Variantes avec class-variance-authority
- Accessibilité WCAG 2.1 AA
- Tailwind CSS uniquement
- Tests unitaires
- Storybook-ready (JSDoc examples)

Référence design : UI_MOCKUPS.md

### Phase 2 : Layout (6 composants)

**2.1 MainLayout.jsx**
```jsx
Layout principal avec :
- Sidebar responsive (open/close)
- Header fixe
- Content area scrollable
- Footer optionnel
- Breadcrumb intégré
- Offline banner conditionnel
- Outlet pour React Router
- Gestion états sidebar (zustand)

Structure :
<div class="flex h-screen">
  <Sidebar />
  <div class="flex-1 flex flex-col">
    <Header />
    <OfflineBanner />
    <main class="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
</div>

Référence : UI_MOCKUPS.md - Layout global
```

**2.2 Sidebar.jsx**
```jsx
Sidebar navigation avec :
- Logo en haut
- Navigation items (icon + label)
- Active state (React Router NavLink)
- Badge count (notifications)
- Collapsible sur mobile
- User menu en bas
- Permissions filtering (ne montrer que routes accessibles)
- Animations smooth

Navigation items basés sur router.jsx
Icônes : lucide-react
```

**2.3 Header.jsx**
```jsx
Header avec :
- Menu toggle (mobile)
- Breadcrumb
- Global search bar
- Notification bell (badge count)
- User avatar dropdown (logout, profile, settings)
- Online/offline indicator
- Sync status (si offline sync en cours)

Actions : onMenuClick, openNotifications, openSearch
```

**Continuer pour :**
- Footer.jsx (version, copyright, liens)
- Breadcrumb.jsx (fil d'Ariane auto depuis route)
- PageHeader.jsx (titre page + actions + description)

### Phase 3 : API Clients (10 fichiers)

Pour CHAQUE ressource, crée client API dans `src/lib/api/` :

**Pattern standard :**
```javascript
import apiClient from './client';

export const [resource]Api = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/[resource]', { params });
    return response.data.data;
  },
  
  getById: async (id) => {
    const response = await apiClient.get(`/[resource]/${id}`);
    return response.data.data;
  },
  
  create: async (data) => {
    const response = await apiClient.post('/[resource]', data);
    return response.data.data;
  },
  
  update: async (id, data) => {
    const response = await apiClient.put(`/[resource]/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id) => {
    const response = await apiClient.delete(`/[resource]/${id}`);
    return response.data;
  },
  
  // Méthodes spécifiques à la ressource
};

export default [resource]Api;
```

**Créer pour :**
1. equipment.js (+ getCalibrationDue)
2. consumables.js (+ getStockAlerts)
3. accessRequests.js (+ approve, reject, fulfill, return, extend)
4. rfid.js (+ encodeTag, readTag, bulkRead)
5. reports.js (+ generate, schedule, getScheduled)
6. notifications.js (+ markAsRead, markAllAsRead)
7. users.js (+ changePassword, resetPassword)
8. studies.js
9. sites.js
10. auditTrail.js (+ verifyIntegrity, export)

Référence endpoints : API_SPECIFICATIONS.md

### Phase 4 : Custom Hooks (13 hooks)

Pour CHAQUE hook, crée dans `src/hooks/` :

**Pattern React Query :**
```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { [resource]Api } from '@/lib/api/[resource]';

export function use[Resource](filters = {}) {
  return useQuery({
    queryKey: ['[resource]', filters],
    queryFn: () => [resource]Api.getAll(filters),
    staleTime: 1000 * 60 * 5 // 5 min
  });
}

export function use[Resource]ById(id) {
  return useQuery({
    queryKey: ['[resource]', id],
    queryFn: () => [resource]Api.getById(id),
    enabled: !!id
  });
}

export function useCreate[Resource]() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: [resource]Api.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['[resource]']);
      toast.success('[Resource] créé avec succès');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erreur création');
    }
  });
}

export function useUpdate[Resource]() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => [resource]Api.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['[resource]']);
      queryClient.invalidateQueries(['[resource]', id]);
      toast.success('[Resource] mis à jour');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erreur mise à jour');
    }
  });
}

export function useDelete[Resource]() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: [resource]Api.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['[resource]']);
      toast.success('[Resource] supprimé');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erreur suppression');
    }
  });
}
```

**Créer :**
1. useAuth.js (login, logout, me, changePassword)
2. useDocuments.js
3. useEquipment.js
4. useConsumables.js
5. useAccessRequests.js (+ approve, reject, fulfill, return, extend)
6. useRFID.js (+ encode, read, bulkRead)
7. useReports.js (+ generate, schedule)
8. useNotifications.js (+ markAsRead, WebSocket)
9. useOfflineSync.js (sync, conflicts)
10. useWebSocket.js (generic)
11. useDebounce.js (utility)
12. useLocalStorage.js (utility)
13. useMediaQuery.js (responsive)

### Phase 5 : Features Components (60+ composants)

Pour CHAQUE feature dans `src/components/features/` :

**5.1 Documents (7 composants)**
```jsx
// DocumentsTable.jsx
Table documents avec :
- Colonnes : Type, Sujet ID, Description, Étude, Site, Statut, RFID, Actions
- Tri par colonnes
- Pagination
- Actions : View, Edit, Delete, Request Access
- Badge statut coloré
- RFID tag indicator
- Click row → navigate to details

Props : documents, isLoading, onRowClick, filters, onFilterChange

// DocumentsFilters.jsx
Filtres documents :
- Search bar (debounced)
- Select étude
- Select site
- Select type document
- Select statut
- Date range picker
- Reset filters button

// DocumentForm.jsx
Formulaire création/édition :
- React Hook Form + Zod validation
- Champs : type, subject_id, description, study, site, storage_location, container
- File upload (optionnel)
- RFID tag assignment
- Submit/Cancel actions
- Loading state

Validation schema (Zod) :
- subject_id required, min 3 chars
- type required
- study_id required
- site_id required
- etc.

// DocumentDetails.jsx
Vue détaillée avec Tabs :
1. Informations - Tous les champs (read-only ou edit mode)
2. Localisation - Map hiérarchique, container info
3. Historique - Timeline mouvements
4. Demandes - Liste access requests liées

Actions header : Edit, Delete, Request Access, Print QR Code

// DocumentCard.jsx
Card résumé document (pour grids) :
- Type icon
- Subject ID (titre)
- Description (truncated)
- Badges : Study, Site, Status
- RFID indicator
- Click → navigate

// DocumentHistory.jsx
Timeline historique :
- Mouvements IN/OUT
- Modifications
- Access requests
- Timestamps
- User qui a fait l'action
- Icons par type d'événement

// DocumentsList.jsx (container)
Composant conteneur qui orchestre :
- DocumentsFilters
- DocumentsTable
- Pagination
- Create button (modal)
- Export button
```

**Répéter ce pattern pour :**

**5.2 Equipment (7 composants)**
- EquipmentList.jsx
- EquipmentTable.jsx (colonnes : Type, Fabricant, Modèle, Serial, Calibration, Statut, Actions)
- EquipmentFilters.jsx
- EquipmentForm.jsx
- EquipmentDetails.jsx (tabs : Info, Calibration, Historique)
- EquipmentCard.jsx
- CalibrationAlert.jsx (banner si calibration due)

**5.3 Consumables (7 composants)**
- ConsumablesList.jsx
- ConsumablesTable.jsx (colonnes : Type, Lot, Expiration, Stock, Seuil Min, Statut, Actions)
- ConsumablesFilters.jsx
- ConsumableForm.jsx
- ConsumableDetails.jsx (tabs : Info, Stock, Historique)
- ConsumableCard.jsx
- StockAlert.jsx (banner si stock bas)

**5.4 Access Requests (8 composants)**
- AccessRequestsList.jsx
- AccessRequestsTable.jsx (colonnes : Numéro, Demandeur, Document, Type, Date, Statut, Actions)
- AccessRequestsFilters.jsx
- AccessRequestForm.jsx (wizard 3 étapes)
- AccessRequestDetails.jsx
- ApprovalPanel.jsx (approve/reject avec raison)
- WorkflowTimeline.jsx (state machine visualization)
- AccessRequestCard.jsx

**5.5 RFID (5 composants)**
- RFIDScanner.jsx (interface scan avec feedback visuel/sonore)
- TagEncoder.jsx (formulaire encoder nouveau tag)
- TagReader.jsx (lecture tag + display info)
- BulkInventory.jsx (scan location complète, rapport anomalies)
- TagHistory.jsx (historique scans tag)

**5.6 Reports (5 composants)**
- ReportGenerator.jsx (wizard 3 étapes : type, filtres, options)
- ReportFilters.jsx (dynamique selon type rapport)
- ReportPreview.jsx (preview avant génération)
- ScheduledReports.jsx (liste, enable/disable)
- ReportHistory.jsx (télécharger anciens rapports)

**5.7 Admin (6 composants)**
- UserManagement.jsx (table users, create/edit/disable)
- UserForm.jsx (formulaire user avec rôles multiples)
- RoleManagement.jsx (liste rôles, permissions)
- PermissionsEditor.jsx (tree permissions par ressource/action)
- SystemSettings.jsx (tabs : Sécurité, Notifications, Workflows, RFID, Général)
- AuditTrailViewer.jsx (table audit avec filtres avancés)

**5.8 Dashboard (6 composants)**
- StatsCard.jsx (KPI card avec icon, valeur, trend)
- CapacityChart.jsx (donut chart capacité sites)
- ActivityChart.jsx (line chart activité derniers 30j)
- AlertsWidget.jsx (liste alertes actives)
- RecentActivity.jsx (timeline 10 dernières actions)
- QuickActions.jsx (boutons actions fréquentes)

**5.9 Shared (8 composants)**
- SearchBar.jsx (recherche globale avec autocomplete)
- NotificationCenter.jsx (dropdown liste notifications)
- OfflineBanner.jsx (banner jaune "Mode hors ligne")
- SyncIndicator.jsx (icône + count pending actions)
- LoadingScreen.jsx (full-screen spinner)
- EmptyState.jsx (illustration + message + CTA)
- ErrorMessage.jsx (error display avec retry)
- ConfirmDialog.jsx (dialogue confirmation actions destructives)

**Standards pour tous les components features :**
- Hooks pour data fetching (useDocuments, etc.)
- Loading states
- Error states
- Empty states
- Responsive design
- Accessibilité
- Tests unitaires
- JSDoc documentation

### Phase 6 : Pages (12 pages)

Pour CHAQUE page dans `src/pages/` :

**6.1 LoginPage.jsx**
```jsx
Page login avec :
- Logo centré
- Formulaire (username, password, remember me)
- React Hook Form + Zod
- Loading state submit
- Error message display
- Lien "Mot de passe oublié"
- Redirection après login (location.state.from ou /dashboard)
- Responsive (mobile-first)

Validation :
- username required, min 3
- password required, min 8

useAuth hook : login mutation
```

**6.2 DashboardPage.jsx**
```jsx
Dashboard avec :
- PageHeader (titre "Tableau de bord", description)
- Grid 4 StatsCards (Total Documents, Demandes En Attente, Alertes Actives, Capacité Moyenne)
- Grid 2 colonnes :
  - Gauche : CapacityChart (50%) + AlertsWidget (50%)
  - Droite : RecentActivity (100%)
- QuickActions floating bottom-right (mobile)

Fetch data : useDocuments, useAccessRequests, useNotifications pour stats

Référence : UI_MOCKUPS.md - Dashboard
```

**6.3 DocumentsListPage.jsx**
```jsx
Page liste documents avec :
- PageHeader (titre, description, bouton "Nouveau Document")
- DocumentsFilters (collapsible sur mobile)
- DocumentsTable
- Pagination
- Modal création (DocumentForm)
- Export button (CSV, Excel)

State : filters, pagination
Hooks : useDocuments(filters), useCreateDocument
```

**6.4 DocumentDetailsPage.jsx**
```jsx
Page détails document avec :
- Breadcrumb (Documents > [subject_id])
- DocumentDetails component
- Actions header : Edit, Delete, Request Access, Back
- Modal edit (DocumentForm en mode edit)
- Dialog confirmation delete

Params : id depuis useParams()
Hook : useDocumentById(id)
```

**Répéter pour :**
- EquipmentListPage.jsx
- EquipmentDetailsPage.jsx
- ConsumablesListPage.jsx
- ConsumableDetailsPage.jsx
- AccessRequestsPage.jsx
- AccessRequestDetailsPage.jsx
- RFIDPage.jsx (tabs : Encoder, Lire, Inventaire)
- ReportsPage.jsx (tabs : Générer, Programmés, Historique)
- AdminPage.jsx (tabs : Utilisateurs, Rôles, Paramètres, Audit Trail)

**6.5 NotFoundPage.jsx**
```jsx
Page 404 avec :
- Illustration (404)
- Titre "Page non trouvée"
- Message explicatif
- Bouton "Retour à l'accueil"
```

**Standards toutes les pages :**
- PageHeader systématique
- Breadcrumb si sous-page
- Loading state (skeleton)
- Error boundary
- Responsive
- Permissions check (redirect si pas autorisé)

Référence design : UI_MOCKUPS.md

### Phase 7 : Offline Support (3 fichiers)

**7.1 src/lib/db/schema.js**
```javascript
Configuration Dexie.js avec tables IndexedDB :

import Dexie from 'dexie';

export const db = new Dexie('ClinicalStorageDB');

db.version(1).stores({
  documents: 'id, subject_id, study_id, site_id, document_type, status, created_at',
  equipment: 'id, serial_number, equipment_type, site_id, operational_status',
  consumables: 'id, lot_number, consumable_type, site_id, expiration_date',
  accessRequests: 'id, request_number, requester_id, status, created_at',
  movements: 'id, item_id, movement_type, timestamp',
  pendingActions: '++id, type, action, data, timestamp, retries',
  syncMetadata: 'key, value'
});

export default db;
```

**7.2 src/lib/db/sync.js**
```javascript
Logique synchronisation offline :

export class SyncManager {
  constructor(db, apiClient) { ... }
  
  // Sauvegarder action en attente
  async queueAction(type, action, data) {
    await db.pendingActions.add({
      type, action, data,
      timestamp: new Date().toISOString(),
      retries: 0
    });
  }
  
  // Synchroniser toutes les actions en attente
  async syncPendingActions() {
    const actions = await db.pendingActions.toArray();
    const results = [];
    
    for (const action of actions) {
      try {
        const result = await this.executeAction(action);
        results.push({ action, success: true, result });
        await db.pendingActions.delete(action.id);
      } catch (error) {
        action.retries++;
        if (action.retries >= 3) {
          results.push({ action, success: false, error: 'Max retries' });
          await db.pendingActions.delete(action.id);
        } else {
          await db.pendingActions.update(action.id, { retries: action.retries });
        }
      }
    }
    
    return results;
  }
  
  // Exécuter une action vers API
  async executeAction(action) {
    const { type, action: method, data } = action;
    const api = getApiForType(type);
    return api[method](data);
  }
  
  // Télécharger données pour usage offline
  async downloadForOffline(filters = {}) {
    const [documents, equipment, consumables] = await Promise.all([
      documentsApi.getAll(filters),
      equipmentApi.getAll(filters),
      consumablesApi.getAll(filters)
    ]);
    
    await db.documents.bulkPut(documents.items);
    await db.equipment.bulkPut(equipment.items);
    await db.consumables.bulkPut(consumables.items);
    
    await db.syncMetadata.put({
      key: 'lastSync',
      value: new Date().toISOString()
    });
  }
}

export const syncManager = new SyncManager(db, apiClient);
```

**7.3 src/lib/db/conflicts.js**
```javascript
Résolution conflits :

export async function resolveConflict(localData, serverData, strategy = 'SERVER_WINS') {
  switch (strategy) {
    case 'SERVER_WINS':
      return serverData;
    
    case 'CLIENT_WINS':
      return localData;
    
    case 'LAST_WRITE_WINS':
      return new Date(localData.updated_at) > new Date(serverData.updated_at)
        ? localData
        : serverData;
    
    case 'MERGE':
      return {
        ...serverData,
        ...localData,
        updated_at: new Date().toISOString()
      };
    
    case 'ASK_USER':
      return { conflict: true, local: localData, server: serverData };
    
    default:
      return serverData;
  }
}
```

### Phase 8 : WebSocket (1 hook)

**8.1 src/hooks/useWebSocket.js**
```javascript
Hook WebSocket pour notifications temps réel :

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';

export function useWebSocket(url) {
  const ws = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const { accessToken } = useAuthStore();
  
  useEffect(() => {
    if (!accessToken) return;
    
    // Connexion WebSocket avec token
    const wsUrl = `${url}?token=${accessToken}`;
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
      
      // Traiter notification
      if (data.type === 'NOTIFICATION') {
        toast.info(data.message);
      }
    };
    
    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    // Cleanup
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, accessToken]);
  
  const sendMessage = (message) => {
    if (ws.current && isConnected) {
      ws.current.send(JSON.stringify(message));
    }
  };
  
  return { isConnected, lastMessage, sendMessage };
}
```

### Phase 9 : Tests (20+ fichiers tests)

**9.1 Configuration Vitest**
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**9.2 Setup Tests**
```javascript
// tests/setup.js
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup après chaque test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**9.3 Tests Composants UI**
```javascript
// tests/components/ui/Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('applies variant classes', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

**Créer tests pour :**
- Tous les composants UI (15 tests)
- Components features principaux (10 tests)
- Hooks (5 tests)
- Pages principales (5 tests)
- Integration tests (3 tests)

Objectif : 70%+ coverage

### Phase 10 : Configuration & Tooling (5 fichiers)

**10.1 .gitignore**
```
# Dependencies
node_modules/
.pnp/
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
dist/
build/

# Misc
.DS_Store
*.log
npm-debug.log*

# Environment
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# Cache
.cache/
.parcel-cache/
```

**10.2 .eslintrc.js**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  env: {
    browser: true,
    es2022: true,
    node: true
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  }
};
```

**10.3 .prettierrc**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**10.4 postcss.config.js**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

**10.5 .env.local**
```bash
# Copie de .env.example avec valeurs
VITE_API_URL=http://localhost:8001/api/v1
VITE_WS_URL=ws://localhost:8004/ws
VITE_APP_NAME=Clinical Storage System
VITE_ENABLE_DEVTOOLS=true
```

## Standards de Code

### React/JavaScript
- Functional components avec hooks uniquement
- Named exports (sauf pages : default export)
- Props avec JSDoc TypeScript-style
- max 200 lignes par composant
- Extraire logique dans custom hooks
- Tailwind CSS uniquement (pas de CSS modules)

### Accessibilité
- Semantic HTML
- ARIA labels sur éléments interactifs
- Navigation clavier complète
- Contraste couleurs WCAG AA
- Focus visible
- Screen reader friendly

### Performance
- React.lazy() pour routes
- useMemo/useCallback appropriés
- Virtual scrolling si listes >100 items
- Image optimization (WebP)
- Code splitting par route
- Debounce sur search inputs (300ms)

### Tests
- Tests unitaires pour composants UI
- Tests intégration pour workflows
- Mock API calls
- Coverage 70%+ minimum

### Responsive
- Mobile-first approach
- Breakpoints Tailwind (sm, md, lg, xl, 2xl)
- Touch-friendly (min 44x44px)
- Sidebar collapsible mobile
- Tables scroll horizontal mobile

## Ordre d'Exécution

Exécute dans cet ordre :

1. ✅ Composants UI (15 composants)
2. ✅ Layout components (6 composants)
3. ✅ API clients (10 fichiers)
4. ✅ Custom hooks (13 hooks)
5. ✅ Features - Documents (7 composants)
6. ✅ Features - Equipment (7 composants)
7. ✅ Features - Consumables (7 composants)
8. ✅ Features - Access Requests (8 composants)
9. ✅ Features - RFID (5 composants)
10. ✅ Features - Reports (5 composants)
11. ✅ Features - Admin (6 composants)
12. ✅ Features - Dashboard (6 composants)
13. ✅ Features - Shared (8 composants)
14. ✅ Pages (12 pages)
15. ✅ Offline support (3 fichiers)
16. ✅ WebSocket (1 hook)
17. ✅ Tests (20+ fichiers)
18. ✅ Configuration (5 fichiers)
19. ✅ Service Worker
20. ✅ Documentation finale

## Validation

Après chaque phase :
- ✅ ESLint passing
- ✅ Prettier formatted
- ✅ Imports résolus
- ✅ PropTypes/JSDoc corrects
- ✅ Composants render sans erreurs
- ✅ Tests passent

## Questions à Poser Avant

1. As-tu lu REACT_ARCHITECTURE.md ?
2. As-tu lu UI_MOCKUPS.md ?
3. As-tu compris la structure des 18 fichiers déjà créés ?
4. L'architecture React est-elle claire ?
5. Les patterns (hooks, components) sont-ils compris ?

## Note Critique

Cette application gère des **données médicales sensibles**. Chaque composant doit être :
- ✅ Sécurisé (pas d'XSS, validation inputs)
- ✅ Accessible (WCAG 2.1 AA)
- ✅ Performant (lazy loading, memoization)
- ✅ Testé (70%+ coverage)
- ✅ Responsive (mobile-first)
- ✅ Offline-capable (PWA)

## Confirmation

Avant de commencer, confirme :
- [ ] Lu REACT_ARCHITECTURE.md
- [ ] Lu UI_MOCKUPS.md
- [ ] Lu API_SPECIFICATIONS.md
- [ ] Compris structure existante (18 fichiers)
- [ ] Plan d'exécution clair
- [ ] Patterns React Query + Zustand compris

Puis réponds : "✅ Prêt à générer le frontend. Je commence par [première phase]."
```

## Utilisation

**Copie ce prompt dans Claude Code.**

Durée estimée : **3-5 heures** de génération

## Après Génération

```bash
# Install dependencies
cd clinical-storage-frontend
npm install

# Start dev server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

Voilà ! 🎨
