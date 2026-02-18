import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Microscope,
  Beaker,
  ClipboardList,
  Tag,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { RoleCode } from '@/types';
import { cn } from '@/lib/utils/utils';

interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  allowedRoles?: RoleCode[];
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Tableau de bord', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Documents', to: '/documents', icon: FileText },
  { label: 'Equipements', to: '/equipment', icon: Microscope },
  { label: 'Consommables', to: '/consumables', icon: Beaker },
  { label: "Demandes d'acces", to: '/access-requests', icon: ClipboardList },
  { label: 'RFID', to: '/rfid', icon: Tag, allowedRoles: ['ARCHIVIST', 'ADMIN'] },
  { label: 'Rapports', to: '/reports', icon: BarChart3 },
  { label: 'Administration', to: '/admin', icon: Settings  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const userRoles = user?.roles?.map((role) => role.code) ?? [];

  const filteredItems = NAVIGATION_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.some((role) => userRoles.includes(role));
  });

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            CS
          </div>
          <span className="text-lg font-semibold text-gray-900">
            Clinical Storage
          </span>
        </div>
        {/* Close button visible on mobile */}
        <button
          type="button"
          className="lg:hidden rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigation principale">
        <ul className="space-y-1">
          {filteredItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    setSidebarOpen(false);
                  }
                }}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Site Info */}
      {user?.sites && user.sites.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Site actif
          </p>
          <p className="mt-1 text-sm text-gray-700 truncate">
            {user.sites[0].name}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar (slide-over) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-30 bg-white border-r border-gray-200 transition-all duration-300',
          sidebarOpen ? 'lg:w-64' : 'lg:w-0 lg:overflow-hidden',
          className,
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
