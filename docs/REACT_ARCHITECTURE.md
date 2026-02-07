# Architecture React.js - Clinical Storage System

## Changements Majeurs : Next.js → React.js

### Différences Clés

| Aspect                | Next.js (Avant)              | React.js (Nouveau)           |
|-----------------------|------------------------------|------------------------------|
| **Framework**         | Next.js 14 (App Router)      | Vite + React 18              |
| **Routing**           | File-based routing           | React Router v6              |
| **Rendu**             | SSR/SSG + Client             | Client-side uniquement (SPA) |
| **API Routes**        | Built-in API routes          | Backend séparé (FastAPI)     |
| **Build Tool**        | Next.js bundler              | Vite                         |
| **Déploiement**       | Vercel/Node.js               | Nginx (fichiers statiques)   |
| **State Management**  | React Query + Zustand        | React Query + Zustand        |
| **Offline Support**   | Service Worker + PWA         | Service Worker + PWA         |

---

## 1. NOUVELLE STACK FRONTEND

### 1.1 Technologies

```json
{
  "core": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "buildTool": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  },
  "stateManagement": {
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7"
  },
  "routing": {
    "react-router-dom": "^6.20.0"
  },
  "http": {
    "axios": "^1.6.5"
  },
  "ui": {
    "@radix-ui/react-*": "latest",
    "tailwindcss": "^3.4.0",
    "lucide-react": "^0.307.0"
  },
  "forms": {
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0"
  },
  "offline": {
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "workbox-window": "^7.0.0"
  },
  "utils": {
    "date-fns": "^3.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  }
}
```

---

## 2. STRUCTURE DE PROJET REACT

```
clinical-storage-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json              # PWA manifest
│   ├── service-worker.js          # Service worker
│   └── assets/
│       ├── icons/
│       └── images/
├── src/
│   ├── main.jsx                   # Point d'entrée
│   ├── App.jsx                    # Composant racine
│   ├── router.jsx                 # Configuration routes
│   │
│   ├── components/
│   │   ├── ui/                    # Composants UI réutilisables
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Table.jsx
│   │   │   └── ...
│   │   ├── layout/                # Layout components
│   │   │   ├── MainLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Footer.jsx
│   │   ├── forms/                 # Form components
│   │   │   ├── DocumentForm.jsx
│   │   │   ├── EquipmentForm.jsx
│   │   │   └── ...
│   │   └── features/              # Feature-specific components
│   │       ├── documents/
│   │       │   ├── DocumentsList.jsx
│   │       │   ├── DocumentDetails.jsx
│   │       │   └── DocumentFilters.jsx
│   │       ├── access-requests/
│   │       ├── rfid/
│   │       └── ...
│   │
│   ├── pages/                     # Page components (routes)
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── ForgotPasswordPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── documents/
│   │   │   ├── DocumentsListPage.jsx
│   │   │   └── DocumentDetailsPage.jsx
│   │   ├── equipment/
│   │   ├── consumables/
│   │   ├── access-requests/
│   │   ├── rfid/
│   │   ├── reports/
│   │   └── admin/
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useDocuments.js
│   │   ├── useAccessRequests.js
│   │   ├── useOfflineSync.js
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── api/                   # API clients
│   │   │   ├── client.js          # Axios instance
│   │   │   ├── auth.js
│   │   │   ├── documents.js
│   │   │   ├── equipment.js
│   │   │   └── ...
│   │   ├── db/                    # IndexedDB (offline)
│   │   │   └── dexie.js
│   │   ├── utils/                 # Utilities
│   │   │   ├── validators.js
│   │   │   ├── formatters.js
│   │   │   └── constants.js
│   │   └── queryClient.js         # React Query config
│   │
│   ├── store/                     # Zustand stores
│   │   ├── authStore.js
│   │   ├── uiStore.js
│   │   └── offlineStore.js
│   │
│   ├── routes/                    # Route configs
│   │   ├── index.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleBasedRoute.jsx
│   │
│   ├── styles/
│   │   ├── index.css              # Global styles
│   │   └── tailwind.css
│   │
│   └── types/                     # TypeScript types (if using TS)
│       └── index.ts
│
├── .env.development
├── .env.production
├── vite.config.js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 3. CONFIGURATION VITE

### 3.1 vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Clinical Storage System',
        short_name: 'Clinical Storage',
        description: 'Gestion d\'entreposage pour études cliniques',
        theme_color: '#1976D2',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.clinical-storage\.com\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

---

## 4. ROUTING (React Router v6)

### 4.1 src/router.jsx

```javascript
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RoleBasedRoute from '@/routes/RoleBasedRoute';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Main pages
import DashboardPage from '@/pages/DashboardPage';
import DocumentsListPage from '@/pages/documents/DocumentsListPage';
import DocumentDetailsPage from '@/pages/documents/DocumentDetailsPage';
import EquipmentListPage from '@/pages/equipment/EquipmentListPage';
import ConsumablesListPage from '@/pages/consumables/ConsumablesListPage';
import AccessRequestsPage from '@/pages/access-requests/AccessRequestsPage';
import RFIDPage from '@/pages/rfid/RFIDPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import AdminPage from '@/pages/admin/AdminPage';

// Error pages
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <DashboardPage />
      },
      {
        path: 'documents',
        children: [
          {
            index: true,
            element: <DocumentsListPage />
          },
          {
            path: ':id',
            element: <DocumentDetailsPage />
          }
        ]
      },
      {
        path: 'equipment',
        element: <EquipmentListPage />
      },
      {
        path: 'consumables',
        element: <ConsumablesListPage />
      },
      {
        path: 'access-requests',
        element: <AccessRequestsPage />
      },
      {
        path: 'rfid',
        element: (
          <RoleBasedRoute allowedRoles={['ARCHIVIST', 'ADMIN']}>
            <RFIDPage />
          </RoleBasedRoute>
        )
      },
      {
        path: 'reports',
        element: <ReportsPage />
      },
      {
        path: 'admin',
        element: (
          <RoleBasedRoute allowedRoles={['ADMIN']}>
            <AdminPage />
          </RoleBasedRoute>
        )
      }
    ]
  },
  {
    path: '*',
    element: <NotFoundPage />
  }
]);
```

---

### 4.2 src/routes/ProtectedRoute.jsx

```javascript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

---

### 4.3 src/routes/RoleBasedRoute.jsx

```javascript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export default function RoleBasedRoute({ children, allowedRoles }) {
  const { user } = useAuthStore();

  const hasRequiredRole = user?.roles?.some(role => 
    allowedRoles.includes(role.code)
  );

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

---

## 5. POINT D'ENTRÉE

### 5.1 src/main.jsx

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/router';
import '@/styles/index.css';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

### 5.2 public/index.html

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Clinical Storage System - Gestion d'entreposage études cliniques" />
    <meta name="theme-color" content="#1976D2" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />
    <title>Clinical Storage System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## 6. LAYOUT PRINCIPAL

### 6.1 src/components/layout/MainLayout.jsx

```javascript
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import OfflineBanner from '@/components/OfflineBanner';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isOffline = useOfflineStatus();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Offline Banner */}
        {isOffline && <OfflineBanner />}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

### 6.2 src/components/layout/Sidebar.jsx

```javascript
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Microscope, 
  Beaker,
  ClipboardList,
  Tag,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Équipements', href: '/equipment', icon: Microscope },
  { name: 'Consommables', href: '/consumables', icon: Beaker },
  { name: 'Demandes d\'Accès', href: '/access-requests', icon: ClipboardList },
  { name: 'RFID', href: '/rfid', icon: Tag, roles: ['ARCHIVIST', 'ADMIN'] },
  { name: 'Rapports', href: '/reports', icon: BarChart3 },
  { name: 'Administration', href: '/admin', icon: Settings, roles: ['ADMIN'] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuthStore();

  const canAccessRoute = (requiredRoles) => {
    if (!requiredRoles) return true;
    return user?.roles?.some(role => requiredRoles.includes(role.code));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 lg:hidden z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">Clinical Storage</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            if (!canAccessRoute(item.roles)) return null;

            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center px-4 py-3 mb-2 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}
```

---

## 7. ÉTAT GLOBAL (ZUSTAND)

### 7.1 src/store/authStore.js

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true
      }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () => set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false
      }),

      hasPermission: (resource, action) => {
        const { user } = get();
        if (!user) return false;
        
        return user.roles?.some(role => 
          role.permissions?.[resource]?.[action] === true
        );
      },

      hasRole: (roleCode) => {
        const { user } = get();
        if (!user) return false;
        
        return user.roles?.some(role => role.code === roleCode);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

---

### 7.2 src/store/offlineStore.js

```javascript
import { create } from 'zustand';

export const useOfflineStore = create((set) => ({
  isOnline: navigator.onLine,
  pendingActions: [],
  syncInProgress: false,

  setOnlineStatus: (status) => set({ isOnline: status }),

  addPendingAction: (action) => set((state) => ({
    pendingActions: [...state.pendingActions, {
      ...action,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    }]
  })),

  removePendingAction: (actionId) => set((state) => ({
    pendingActions: state.pendingActions.filter(a => a.id !== actionId)
  })),

  setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),

  clearPendingActions: () => set({ pendingActions: [] })
}));
```

---

## 8. API CLIENT (AXIOS)

### 8.1 src/lib/api/client.js

```javascript
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { access_token } = response.data.data;
        useAuthStore.getState().setAccessToken(access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        useAuthStore.getState().logout();
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

## 9. EXEMPLE PAGE COMPLÈTE

### 9.1 src/pages/documents/DocumentsListPage.jsx

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import DocumentsTable from '@/components/features/documents/DocumentsTable';
import DocumentFilters from '@/components/features/documents/DocumentFilters';
import Button from '@/components/ui/Button';
import CreateDocumentModal from '@/components/features/documents/CreateDocumentModal';

export default function DocumentsListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    study_id: null,
    site_id: null,
    document_type: null,
    status: null,
    page: 1,
    page_size: 50
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: documents, isLoading, error } = useDocuments(filters);

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleDocumentClick = (document) => {
    navigate(`/documents/${document.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos documents source et consentements
          </p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Nouveau
        </Button>
      </div>

      {/* Filters */}
      <DocumentFilters 
        filters={filters}
        onChange={handleFilterChange}
      />

      {/* Table */}
      <DocumentsTable
        documents={documents?.items || []}
        isLoading={isLoading}
        error={error}
        onDocumentClick={handleDocumentClick}
        pagination={{
          page: filters.page,
          pageSize: filters.page_size,
          totalItems: documents?.pagination?.total_items || 0,
          totalPages: documents?.pagination?.total_pages || 0
        }}
        onPageChange={handlePageChange}
      />

      {/* Create Modal */}
      <CreateDocumentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}
```

---

## 10. DÉPLOIEMENT

### 10.1 Build Production

```bash
# Build
npm run build

# Preview
npm run preview
```

**Sortie:** Dossier `dist/` contenant fichiers statiques

---

### 10.2 Nginx Configuration

```nginx
server {
    listen 80;
    server_name clinical-storage.example.com;
    root /var/www/clinical-storage/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker
    location /service-worker.js {
        add_header Cache-Control "no-cache";
        expires off;
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:8001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # React Router - SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 11. DOCKER

### 11.1 Dockerfile (Multi-stage)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 11.2 docker-compose.yml (extrait)

```yaml
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: clinical-frontend
    ports:
      - "80:80"
    depends_on:
      - core-api
      - auth-service
    networks:
      - clinical-network
    restart: unless-stopped
```

---

## 12. VARIABLES D'ENVIRONNEMENT

### 12.1 .env.development

```bash
VITE_API_URL=http://localhost:8001/api/v1
VITE_WS_URL=ws://localhost:8001/ws
VITE_APP_NAME=Clinical Storage System
VITE_ENABLE_DEVTOOLS=true
```

### 12.2 .env.production

```bash
VITE_API_URL=https://api.clinical-storage.com/api/v1
VITE_WS_URL=wss://api.clinical-storage.com/ws
VITE_APP_NAME=Clinical Storage System
VITE_ENABLE_DEVTOOLS=false
```

---

## 13. PACKAGE.JSON COMPLET

```json
{
  "name": "clinical-storage-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
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
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.4",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "vitest": "^1.1.0",
    "@vitest/ui": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1"
  }
}
```

---

## RÉSUMÉ DES CHANGEMENTS

### ✅ Avantages React.js (vs Next.js)

1. **Plus simple** - Pas de concepts SSR/SSG
2. **Plus léger** - Bundle plus petit
3. **Plus flexible** - Routing manuel contrôlable
4. **Déploiement facile** - Fichiers statiques → Nginx
5. **Pas de lock-in** - Framework agnostique

### ⚠️ Compromis

1. **Pas de SSR** - SEO moins bon (mais pas critique pour app interne)
2. **Routing manuel** - React Router à configurer
3. **Pas d'API routes** - Backend complètement séparé (déjà le cas)

### 🎯 Recommandation

**React.js avec Vite est parfait pour cette application car:**
- Application interne (pas besoin SEO)
- SPA convient parfaitement
- Performance excellente avec Vite
- Déploiement ultra-simple (fichiers statiques)
- Bundle optimisé et léger

---

**L'architecture React.js est maintenant prête ! Voulez-vous que je crée les fichiers d'implémentation détaillés ?**
