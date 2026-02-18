import { useState, useEffect, useCallback } from 'react';
import { useOfflineStore } from '@/store/offlineStore';
import { syncManager } from '@/lib/db/sync';

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
    setSyncInProgress,
    setOnlineStatus,
    setLastSyncAt,
    clearPendingActions,
  } = useOfflineStore();

  useEffect(() => {
    setOnlineStatus(isOnline);
  }, [isOnline, setOnlineStatus]);

  const queueAction = useCallback(
    (type: string, method: string, args?: unknown[]) => {
      addPendingAction({ type, method, args });
      // Also queue in IndexedDB for persistence across page reloads
      syncManager.queueAction(type, method, args);
    },
    [addPendingAction]
  );

  const syncPending = useCallback(async () => {
    if (syncInProgress || !isOnline) return;

    setSyncInProgress(true);

    try {
      const result = await syncManager.syncPendingActions();

      // Clear the Zustand store actions (IndexedDB ones already handled by SyncManager)
      clearPendingActions();
      setLastSyncAt(new Date().toISOString());

      return result;
    } catch {
      // Will retry on next sync
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, isOnline, setSyncInProgress, clearPendingActions, setLastSyncAt]);

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
