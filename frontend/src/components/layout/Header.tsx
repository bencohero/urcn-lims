import { Menu, Search, Bell, LogOut, User, Settings } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Breadcrumb } from './Breadcrumb';
import { getInitials } from '@/lib/utils/utils';
import { cn } from '@/lib/utils/utils';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleSidebar, setSearchOpen, notificationsOpen, setNotificationsOpen } = useUIStore();

  const initials = user
    ? getInitials(user.first_name, user.last_name)
    : '??';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6',
        className,
      )}
    >
      {/* Sidebar toggle */}
      <button
        type="button"
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        onClick={toggleSidebar}
        aria-label="Ouvrir / fermer le menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb */}
      <Breadcrumb className="hidden sm:flex" />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          type="button"
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          onClick={() => setSearchOpen(true)}
          aria-label="Rechercher"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className={cn(
            'relative rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors',
            notificationsOpen && 'bg-gray-100 text-gray-700',
          )}
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md p-1 hover:bg-gray-100 transition-colors"
              aria-label="Menu utilisateur"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user ? `${user.first_name} ${user.last_name}` : ''}
              </span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
            >
              {user && (
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              )}

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100"
                onSelect={() => navigate('/profile')}
              >
                <User className="h-4 w-4" />
                Profil
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100"
                onSelect={() => navigate('/settings')}
              >
                <Settings className="h-4 w-4" />
                Parametres
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 outline-none hover:bg-red-50 focus:bg-red-50"
                onSelect={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Deconnexion
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
