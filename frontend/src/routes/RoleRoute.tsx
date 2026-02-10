import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { RoleCode } from '@/types';

interface RoleRouteProps {
  allowedRoles: RoleCode[];
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuthStore();

  const hasAccess = user?.roles?.some((role) =>
    allowedRoles.includes(role.code),
  );

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
