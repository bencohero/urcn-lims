import { useEffect } from "react";
import { STORAGE_KEYS, useAuthStore } from "./store/authStore";

export const AuthSyncListener = () => {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.ACCESS_TOKEN) {
        if (event.newValue) {
          setAccessToken(event.newValue);
        }
      }

      if (event.key === STORAGE_KEYS.LOGOUT) {
        logout();
        window.location.href = '/login';
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setAccessToken, logout]);

  return null;
};
