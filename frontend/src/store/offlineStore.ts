import { create } from 'zustand';
import type { PendingAction } from '@/types';

interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];
  syncInProgress: boolean;
  lastSyncAt: string | null;
  setOnlineStatus: (status: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, 'id' | 'timestamp'>) => void;
  removePendingAction: (actionId: string) => void;
  setSyncInProgress: (inProgress: boolean) => void;
  setLastSyncAt: (date: string) => void;
  clearPendingActions: () => void;
}

export const useOfflineStore = create<OfflineState>()((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingActions: [],
  syncInProgress: false,
  lastSyncAt: null,

  setOnlineStatus: (status) => set({ isOnline: status }),

  addPendingAction: (action) =>
    set((state) => ({
      pendingActions: [
        ...state.pendingActions,
        {
          ...action,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  removePendingAction: (actionId) =>
    set((state) => ({
      pendingActions: state.pendingActions.filter((a) => a.id !== actionId),
    })),

  setSyncInProgress: (inProgress) => set({ syncInProgress: inProgress }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),
  clearPendingActions: () => set({ pendingActions: [] }),
}));
