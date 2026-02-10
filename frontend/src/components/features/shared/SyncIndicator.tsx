import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils/utils';

interface SyncIndicatorProps {
  className?: string;
}

export function SyncIndicator({ className }: SyncIndicatorProps) {
  const { isOnline, pendingCount, syncInProgress } = useOfflineSync();

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {syncInProgress ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />
          <span className="text-xs text-amber-600">Synchronisation...</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          {pendingCount > 0 && (
            <span className="text-xs text-amber-600">{pendingCount} en attente</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-xs text-red-600">Hors ligne</span>
          {pendingCount > 0 && (
            <span className="text-xs text-gray-500">({pendingCount})</span>
          )}
        </>
      )}
    </div>
  );
}
