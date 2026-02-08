# Architecture React TypeScript - Clinical Storage System

## Changements Majeurs : Next.js → React.js + TypeScript

### Différences Clés

| Aspect                | Next.js (Avant)              | React.js + TypeScript (Nouveau) |
|-----------------------|------------------------------|----------------------------------|
| **Framework**         | Next.js 14 (App Router)      | Vite + React 18 + TypeScript 5   |
| **Type Safety**       | PropTypes / JSDoc            | TypeScript natif                 |
| **Routing**           | File-based routing           | React Router v6                  |
| **Rendu**             | SSR/SSG + Client             | Client-side uniquement (SPA)     |
| **API Routes**        | Built-in API routes          | Backend séparé (FastAPI)         |
| **Build Tool**        | Next.js bundler              | Vite                             |
| **Déploiement**       | Vercel/Node.js               | Nginx (fichiers statiques)       |
| **State Management**  | React Query + Zustand        | React Query + Zustand (typed)    |

---

## 1. NOUVELLE STACK FRONTEND TYPESCRIPT

### 1.1 Technologies

```json
{
  "core": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.1",
    "typescript": "^5.3.3"
  },
  "buildTool": {
    "vite": "^5.0.11",
    "@vitejs/plugin-react": "^4.2.1"
  },
  "stateManagement": {
    "@tanstack/react-query": "^5.17.19",
    "zustand": "^4.4.7"
  },
  "types": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/node": "^20.11.5"
  },
  "http": {
    "axios": "^1.6.5"
  },
  "ui": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-select": "^2.0.0",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.307.0",
    "class-variance-authority": "^0.7.0"
  },
  "forms": {
    "react-hook-form": "^7.49.3",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4"
  },
  "offline": {
    "dexie": "^3.2.4",
    "dexie-react-hooks": "^1.1.7",
    "workbox-window": "^7.0.0"
  },
  "utils": {
    "date-fns": "^3.0.6",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.1.2"
  }
}
```

---

## 2. STRUCTURE DE PROJET TYPESCRIPT

```
clinical-storage-frontend/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── main.tsx                   # Point d'entrée (.tsx)
│   ├── App.tsx
│   ├── router.tsx
│   ├── vite-env.d.ts              # Vite types
│   │
│   ├── types/                     # 🆕 Type definitions
│   │   ├── index.ts              # Re-exports
│   │   ├── api.ts                # API types
│   │   ├── models.ts             # Domain models
│   │   ├── components.ts         # Component props
│   │   ├── hooks.ts              # Hook return types
│   │   ├── stores.ts             # Store types
│   │   ├── forms.ts              # Form types
│   │   └── utils.ts              # Utility types
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx        # Tous en .tsx
│   │   │   ├── Button.types.ts   # Types séparés (optionnel)
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── features/
│   │       ├── documents/
│   │       │   ├── DocumentsList.tsx
│   │       │   ├── DocumentsTable.tsx
│   │       │   ├── types.ts      # Feature types
│   │       │   └── ...
│   │       ├── equipment/
│   │       └── ...
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── documents/
│   │   │   ├── DocumentsListPage.tsx
│   │   │   └── DocumentDetailsPage.tsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useAuth.ts            # Tous en .ts
│   │   ├── useDocuments.ts
│   │   ├── useEquipment.ts
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── types.ts          # API client types
│   │   │   ├── auth.ts
│   │   │   ├── documents.ts
│   │   │   └── ...
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   ├── types.ts          # IndexedDB types
│   │   │   └── sync.ts
│   │   ├── utils/
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   └── types.ts          # Utility types
│   │   ├── queryClient.ts
│   │   └── utils.ts
│   │
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── uiStore.ts
│   │   ├── offlineStore.ts
│   │   └── types.ts              # All store types
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx
│   │   └── RoleBasedRoute.tsx
│   │
│   └── styles/
│       └── index.css
│
├── tsconfig.json                  # 🆕 TypeScript config
├── tsconfig.node.json             # 🆕 Node config
├── vite.config.ts                 # .ts au lieu de .js
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 3. CONFIGURATION TYPESCRIPT

### 3.1 tsconfig.json

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

    /* Linting - STRICT MODE */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/types": ["./src/types"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/store/*": ["./src/store/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.2 tsconfig.node.json

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

### 3.3 vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Clinical Storage System',
        short_name: 'Clinical Storage',
        theme_color: '#1976D2',
        background_color: '#ffffff',
        display: 'standalone',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## 4. TYPES CENTRALISÉS

### 4.1 src/types/models.ts

```typescript
// Base types
export type UUID = string;

export interface Timestamps {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  INVESTIGATOR = 'INVESTIGATOR',
  ARC = 'ARC',
  MONITOR = 'MONITOR',
  ARCHIVIST = 'ARCHIVIST',
  DATA_MANAGER = 'DATA_MANAGER',
  DATA_CLERK = 'DATA_CLERK',
}

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

// Models
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

export interface Role {
  id: UUID;
  code: UserRole;
  name: string;
  description: string;
  permissions: Record<string, Record<string, boolean>>;
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
  study?: Study;
  site?: Site;
  storage_location?: StorageLocation;
  container?: Container | null;
  rfid_tag?: RFIDTag | null;
}

export interface Study extends Timestamps {
  id: UUID;
  code: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'SUSPENDED';
}

export interface Site extends Timestamps {
  id: UUID;
  code: string;
  name: string;
  address: string;
  city: string;
  country: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// ... autres models
```

### 4.2 src/types/api.ts

```typescript
import type { AxiosResponse } from 'axios';

// API Response wrapper
export interface APIResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message?: string;
  timestamp: string;
}

// Pagination
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

// Error handling
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

// Type guards
export function isErrorResponse(
  response: APIResponse<unknown> | ErrorResponse
): response is ErrorResponse {
  return response.success === false && 'error' in response;
}

// Generic API function return type
export type APIResult<T> = Promise<AxiosResponse<APIResponse<T>>>;
```

### 4.3 src/types/components.ts

```typescript
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// Button
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'danger' 
  | 'success' 
  | 'outline' 
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Input
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

// Table
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

// Modal
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
}
```

### 4.4 src/types/hooks.ts

```typescript
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

// Generic query/mutation types
export type QueryResult<TData> = UseQueryResult<TData, AxiosError>;
export type MutationResult<TData, TVariables> = UseMutationResult<
  TData,
  AxiosError,
  TVariables
>;

// Specific hook return types
export interface UseDocumentsOptions {
  filters?: DocumentFilters;
  enabled?: boolean;
}

export interface UseDocumentsResult {
  documents: Document[] | undefined;
  pagination: PaginationMeta | undefined;
  isLoading: boolean;
  error: AxiosError | null;
  refetch: () => void;
}
```

---

## 5. COMPOSANTS TYPESCRIPT

### 5.1 Composant UI avec Types

**src/components/ui/Button.tsx**

```typescript
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ButtonProps } from '@/types/components';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        success: 'bg-green-600 text-white hover:bg-green-700',
        outline: 'border-2 border-gray-300 hover:bg-gray-50',
        ghost: 'hover:bg-gray-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonPropsExtended extends ButtonProps, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonPropsExtended>(
  (
    {
      className,
      variant,
      size,
      icon,
      iconPosition = 'left',
      loading = false,
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
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
```

### 5.2 Table Générique avec Types

**src/components/ui/Table.tsx**

```typescript
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import { cn } from '@/lib/utils';

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<TData>({
  table,
  isLoading = false,
  emptyMessage = 'Aucune donnée disponible',
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-gray-50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="px-6 py-12 text-center"
              >
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                </div>
              </td>
            </tr>
          ) : table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={table.getAllColumns().length}
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b transition-colors hover:bg-gray-50',
                  row.getIsSelected() && 'bg-blue-50'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 6. HOOKS TYPESCRIPT

### 6.1 Custom Hook Typé

**src/hooks/useDocuments.ts**

```typescript
import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';
import { toast } from '@/components/ui/Toast';
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentFilters,
  PaginatedResponse,
} from '@/types';
import type { AxiosError } from 'axios';

// Hook options type
interface UseDocumentsOptions {
  filters?: DocumentFilters;
  queryOptions?: Omit<
    UseQueryOptions<PaginatedResponse<Document>, AxiosError>,
    'queryKey' | 'queryFn'
  >;
}

export function useDocuments({ filters = {}, queryOptions }: UseDocumentsOptions = {}) {
  return useQuery<PaginatedResponse<Document>, AxiosError>({
    queryKey: ['documents', filters],
    queryFn: () => documentsApi.getDocuments(filters),
    staleTime: 1000 * 60 * 5,
    ...queryOptions,
  });
}

export function useDocumentById(id: string, enabled = true) {
  return useQuery<Document, AxiosError>({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getDocumentById(id),
    enabled: !!id && enabled,
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

  return useMutation<
    Document,
    AxiosError,
    { id: string; data: DocumentUpdate }
  >({
    mutationFn: ({ id, data }) => documentsApi.updateDocument(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents', variables.id] });
      toast.success('Document mis à jour');
    },
    onError: (error) => {
      const message = error.response?.data?.error?.message || 'Erreur de mise à jour';
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
      const message = error.response?.data?.error?.message || 'Erreur de suppression';
      toast.error(message);
    },
  });
}
```

---

## 7. API CLIENT TYPESCRIPT

### 7.1 Client Axios Typé

**src/lib/api/client.ts**

```typescript
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import type { APIResponse, ErrorResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post<APIResponse<{ access_token: string }>>(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token } = response.data.data!;
        useAuthStore.getState().setAccessToken(access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
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

### 7.2 API Resource Typé

**src/lib/api/documents.ts**

```typescript
import { apiClient } from './client';
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentFilters,
  PaginatedResponse,
  APIResponse,
} from '@/types';

export const documentsApi = {
  async getDocuments(
    filters: DocumentFilters = {}
  ): Promise<PaginatedResponse<Document>> {
    const response = await apiClient.get<APIResponse<PaginatedResponse<Document>>>(
      '/documents',
      { params: filters }
    );
    
    if (!response.data.data) {
      throw new Error('No data in response');
    }
    
    return response.data.data;
  },

  async getDocumentById(id: string): Promise<Document> {
    const response = await apiClient.get<APIResponse<Document>>(`/documents/${id}`);
    
    if (!response.data.data) {
      throw new Error('Document not found');
    }
    
    return response.data.data;
  },

  async createDocument(data: DocumentCreate): Promise<Document> {
    const response = await apiClient.post<APIResponse<Document>>('/documents', data);
    
    if (!response.data.data) {
      throw new Error('Failed to create document');
    }
    
    return response.data.data;
  },

  async updateDocument(id: string, data: DocumentUpdate): Promise<Document> {
    const response = await apiClient.put<APIResponse<Document>>(
      `/documents/${id}`,
      data
    );
    
    if (!response.data.data) {
      throw new Error('Failed to update document');
    }
    
    return response.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },
};

export default documentsApi;
```

---

## 8. STORE TYPESCRIPT (ZUSTAND)

### 8.1 Auth Store Typé

**src/store/authStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleCode: UserRole) => boolean;
  hasAnyRole: (roleCodes: UserRole[]) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // Actions
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      setAccessToken: (accessToken) => {
        set({ accessToken });
      },

      setUser: (user) => {
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

      hasPermission: (resource, action) => {
        const { user } = get();
        if (!user) return false;

        // Admin has all permissions
        if (user.roles.some((role) => role.code === UserRole.ADMIN)) {
          return true;
        }

        // Check specific permission
        return user.roles.some(
          (role) => role.permissions[resource]?.[action] === true
        );
      },

      hasRole: (roleCode) => {
        const { user } = get();
        if (!user) return false;

        return user.roles.some((role) => role.code === roleCode);
      },

      hasAnyRole: (roleCodes) => {
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

## 9. FORMULAIRES TYPESCRIPT

### 9.1 Form avec React Hook Form + Zod

**src/components/features/documents/DocumentForm.tsx**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { DocumentType } from '@/types';
import type { DocumentCreate } from '@/types';

// Zod schema
const documentSchema = z.object({
  document_type: z.nativeEnum(DocumentType),
  subject_id: z.string().min(3, 'Minimum 3 caractères').max(50),
  description: z.string().min(10, 'Minimum 10 caractères'),
  study_id: z.string().uuid('UUID invalide'),
  site_id: z.string().uuid('UUID invalide'),
  storage_location_id: z.string().uuid('UUID invalide'),
  container_id: z.string().uuid().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface DocumentFormProps {
  onSubmit: (data: DocumentCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<DocumentFormValues>;
}

export function DocumentForm({
  onSubmit,
  onCancel,
  isLoading = false,
  defaultValues,
}: DocumentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues,
  });

  const onSubmitForm = (data: DocumentFormValues) => {
    onSubmit(data as DocumentCreate);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Select
        label="Type de document"
        {...register('document_type')}
        error={errors.document_type?.message}
        options={Object.values(DocumentType).map((type) => ({
          value: type,
          label: type,
        }))}
      />

      <Input
        label="Sujet ID"
        {...register('subject_id')}
        error={errors.subject_id?.message}
        placeholder="SUB-001"
      />

      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
        placeholder="Description du document"
      />

      {/* ... autres champs */}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={isLoading}>
          Créer
        </Button>
      </div>
    </form>
  );
}
```

---

## 10. AVANTAGES TYPESCRIPT

### 10.1 Type Safety

```typescript
// ✅ Détection d'erreurs à la compilation
const doc: Document = {
  id: '123',
  document_type: 'INVALID', // ❌ Error: Type '"INVALID"' is not assignable
  // ...
};

// ✅ Autocomplétion intelligente
document.document_type. // IntelliSense montre: CONSENT, CRF, etc.

// ✅ Props validation
<Button variant="invalid" /> // ❌ Error: Type '"invalid"' is not assignable
```

### 10.2 Refactoring Sûr

```typescript
// Renommer un champ = refactoring automatique partout
interface Document {
  subject_id: string; // Renommer en patient_id
}

// TypeScript signale TOUTES les utilisations à mettre à jour
```

### 10.3 Documentation Vivante

```typescript
// Types = documentation toujours à jour
interface ButtonProps {
  /** Variante visuelle du bouton */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Affiche un spinner de chargement */
  loading?: boolean;
  /** Icône à afficher */
  icon?: ReactNode;
}
```

---

## 11. COMMANDES

```bash
# Type checking
npm run type-check

# Build (vérifie types automatiquement)
npm run build

# Lint avec TypeScript
npm run lint

# Dev avec type checking temps réel
npm run dev
```

---

## 12. VS CODE CONFIGURATION

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

**TypeScript apporte une sécurité et une productivité incomparables au développement React !** 🎯
