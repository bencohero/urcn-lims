import { useState, useEffect, useCallback } from 'react';
import { useOfflineStore } from '@/store/offlineStore';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const {
    pendingActions,
    syncInProgress,
    addPendingAction,
    removePendingAction,
    setSyncInProgress,
    setOnlineStatus,
  } = useOfflineStore();

  useEffect(() => {
    setOnlineStatus(isOnline);
  }, [isOnline, setOnlineStatus]);

  const queueAction = useCallback(
    (type: string, method: string, args?: unknown[]) => {
      addPendingAction({ type, method, args });
    },
    [addPendingAction]
  );

  const syncPending = useCallback(async () => {
    if (syncInProgress || pendingActions.length === 0 || !isOnline) return;

    setSyncInProgress(true);

    for (const pending of pendingActions) {
      try {
        // Each pending action would be replayed against the API
        // This is a simplified version; real implementation would
        // map type+action to actual API calls
        removePendingAction(pending.id);
      } catch {
        // Will retry on next sync
        break;
      }
    }

    setSyncInProgress(false);
  }, [syncInProgress, pendingActions, isOnline, setSyncInProgress, removePendingAction]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingActions.length > 0) {
      syncPending();
    }
  }, [isOnline, pendingActions.length, syncPending]);

  return {
    isOnline,
    pendingCount: pendingActions.length,
    syncInProgress,
    queueAction,
    syncPending,
  };
}
