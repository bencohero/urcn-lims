import { useEffect, useRef, useState } from 'react';
import { useAuthStore, STORAGE_KEYS } from '@/store/authStore';
import { SessionExpiryWarningModal } from './components/ui/SessionExpiryWarningModal';


const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 min
const WARNING_BEFORE = 60 * 1000; // 1 min

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
];

export const IdleSessionManager = () => {
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [showWarning, setShowWarning] = useState(false);
  const [remaining, setRemaining] = useState(60);

  const intervalRef = useRef<number | null>(null);

  const updateActivity = () => {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
    localStorage.removeItem(STORAGE_KEYS.SESSION_WARNING);
    setShowWarning(false);
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
     Idle checker + warning
  ================================ */

  useEffect(() => {
    if (!isAuthenticated) return;

    intervalRef.current = window.setInterval(() => {
      const last = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      if (!last) return;

      const idleTime = Date.now() - Number(last);
      const remainingTime = IDLE_TIMEOUT - idleTime;

      if (remainingTime <= WARNING_BEFORE && remainingTime > 0) {
        localStorage.setItem(STORAGE_KEYS.SESSION_WARNING, remainingTime.toString());
        setRemaining(Math.ceil(remainingTime / 1000));
        setShowWarning(true);
      }

      if (remainingTime <= 0) {
        logout();
        window.location.href = '/login';
      }
    }, 1000); // ⏱️ précision seconde

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, logout]);

  /* ================================
     Multi-tab sync
  ================================ */

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.SESSION_WARNING && event.newValue) {
        const ms = Number(event.newValue);
        setRemaining(Math.ceil(ms / 1000));
        setShowWarning(true);
      }

      if (event.key === STORAGE_KEYS.LOGOUT) {
        logout();
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [logout]);

  return (
    <SessionExpiryWarningModal
      open={showWarning}
      remainingSeconds={remaining}
      onExtend={updateActivity}
    />
  );
};
