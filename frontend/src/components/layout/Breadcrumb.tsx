import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  documents: 'Documents',
  equipment: 'Equipements',
  consumables: 'Consommables',
  'access-requests': "Demandes d'acces",
  rfid: 'RFID',
  reports: 'Rapports',
  admin: 'Administration',
  profile: 'Profil',
  settings: 'Parametres',
};

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const location = useLocation();

  const pathSegments = location.pathname
    .split('/')
    .filter((segment) => segment !== '');

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center space-x-1 text-sm text-gray-500">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center hover:text-gray-700 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>

        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          const isLast = index === pathSegments.length - 1;
          const label = ROUTE_LABELS[segment] || decodeURIComponent(segment);

          return (
            <li key={path} className="flex items-center">
              <ChevronRight className="h-4 w-4 mx-1 text-gray-400 flex-shrink-0" />
              {isLast ? (
                <span className="font-medium text-gray-900">{label}</span>
              ) : (
                <Link
                  to={path}
                  className="hover:text-gray-700 transition-colors"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
