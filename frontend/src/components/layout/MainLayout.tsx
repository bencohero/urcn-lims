import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { OfflineBanner } from '@/components/features/shared/OfflineBanner';
import { SearchModal } from '@/components/ui/SearchModal';
import { NotificationsPanel } from '@/components/features/notifications/NotificationsPanel';
import { useOfflineStore } from '@/store/offlineStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils/utils';

export function MainLayout() {
  const { isOnline } = useOfflineStore();
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area shifts based on sidebar state on desktop */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-0',
        )}
      >
        {/* Offline banner */}
        {!isOnline && <OfflineBanner />}

        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Global search modal */}
      <SearchModal />

      {/* Notifications panel */}
      <NotificationsPanel />
    </div>
  );
}
