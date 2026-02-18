import { WifiOff } from 'lucide-react';
import { useOfflineStore } from '@/store/offlineStore';
import { cn } from '@/lib/utils/utils';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, pendingActions } = useOfflineStore();

  if (isOnline) {
    return null;
  }

  const pendingCount = pendingActions.length;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800',
        className,
      )}
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium">Mode hors ligne</span>
      {pendingCount > 0 && (
        <span className="text-amber-600">
          &mdash; {pendingCount} action{pendingCount > 1 ? 's' : ''} en attente
          de synchronisation
        </span>
      )}
    </div>
  );
}
