import { useEffect, useRef } from 'react';
import { useAuthStore, STORAGE_KEYS } from '@/store/authStore';

const IDLE_TIMEOUT = 15 * 60 * 1000; // ⏰ 15 minutes (à ajuster)

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
];

export const IdleTimeoutListener = () => {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const intervalRef = useRef<number | null>(null);

  /* ================================
     Update last activity
  ================================ */

  const updateActivity = () => {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  };

  /* ================================
     Activity listeners
  ================================ */

  useEffect(() => {
    if (!isAuthenticated) return;

    updateActivity();

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, updateActivity, { passive: true })
    );

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, updateActivity));
    };
  }, [isAuthenticated]);

  /* ================================
     Idle checker (all tabs)
  ================================ */

  useEffect(() => {
    if (!isAuthenticated) return;

    intervalRef.current = window.setInterval(() => {
      const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);

      if (!lastActivity) return;

      const idleTime = Date.now() - Number(lastActivity);

      if (idleTime >= IDLE_TIMEOUT) {
        logout();
        window.location.href = '/login';
      }
    }, 60_000); // check every 1 min

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, logout]);

  /* ================================
     Sync between tabs
  ================================ */

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.LOGOUT) {
        logout();
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  return null;
};

