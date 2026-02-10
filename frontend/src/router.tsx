import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';

// Lazy-loaded pages
import { lazy, Suspense, type ComponentType } from 'react';
import { Spinner } from '@/components/ui/Spinner';

function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(factory);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

// Auth pages
const LoginPage = () => lazyPage(() => import('@/pages/auth/LoginPage'));
const ForgotPasswordPage = () => lazyPage(() => import('@/pages/auth/ForgotPasswordPage'));

// Protected pages
const DashboardPage = () => lazyPage(() => import('@/pages/DashboardPage'));
const DocumentsListPage = () => lazyPage(() => import('@/pages/documents/DocumentsListPage'));
const DocumentDetailPage = () => lazyPage(() => import('@/pages/documents/DocumentDetailPage'));
const EquipmentListPage = () => lazyPage(() => import('@/pages/equipment/EquipmentListPage'));
const EquipmentDetailPage = () => lazyPage(() => import('@/pages/equipment/EquipmentDetailPage'));
const ConsumablesListPage = () => lazyPage(() => import('@/pages/consumables/ConsumablesListPage'));
const ConsumableDetailPage = () => lazyPage(() => import('@/pages/consumables/ConsumableDetailPage'));
const AccessRequestsPage = () => lazyPage(() => import('@/pages/access-requests/AccessRequestsPage'));
const AccessRequestDetailPage = () => lazyPage(() => import('@/pages/access-requests/AccessRequestDetailPage'));
const RFIDPage = () => lazyPage(() => import('@/pages/rfid/RFIDPage'));
const ReportsPage = () => lazyPage(() => import('@/pages/reports/ReportsPage'));
const AdminUsersPage = () => lazyPage(() => import('@/pages/admin/AdminUsersPage'));
const AuditTrailPage = () => lazyPage(() => import('@/pages/admin/AuditTrailPage'));
const NotFoundPage = () => lazyPage(() => import('@/pages/NotFoundPage'));

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <DashboardPage /> },

          // Documents
          { path: 'documents', element: <DocumentsListPage /> },
          { path: 'documents/:id', element: <DocumentDetailPage /> },

          // Equipment
          { path: 'equipment', element: <EquipmentListPage /> },
          { path: 'equipment/:id', element: <EquipmentDetailPage /> },

          // Consumables
          { path: 'consumables', element: <ConsumablesListPage /> },
          { path: 'consumables/:id', element: <ConsumableDetailPage /> },

          // Access Requests
          { path: 'access-requests', element: <AccessRequestsPage /> },
          { path: 'access-requests/:id', element: <AccessRequestDetailPage /> },

          // RFID (restricted)
          {
            element: <RoleRoute allowedRoles={['ADMIN', 'ARCHIVIST']} />,
            children: [{ path: 'rfid', element: <RFIDPage /> }],
          },

          // Reports
          { path: 'reports', element: <ReportsPage /> },

          // Admin (restricted)
          { path: 'admin', element: <Navigate to="/admin/users" replace /> },
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/audit-trail', element: <AuditTrailPage /> },
          
          {
            element: <RoleRoute allowedRoles={['ADMIN']} />,
            children: [
              { path: 'admin', element: <Navigate to="/admin/users" replace /> },
              { path: 'admin/users', element: <AdminUsersPage /> },
              { path: 'admin/audit-trail', element: <AuditTrailPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all
  { path: '*', element: <NotFoundPage /> },
]);
