import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RoleCode } from '@/types';

/**
 * Decode JWT payload without verification (client-side expiry check only).
 * Returns the exp timestamp in seconds, or null if unparseable.
 */
function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const exp = getTokenExp(token);
  if (exp === null) return true;
  // Consider expired if less than 30s remaining (buffer for network latency)
  return exp * 1000 < Date.now() + 30_000;
}


/* ================================
   Storage keys (GLOBAL)
================================ */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth.access_token',
  REFRESH_TOKEN: 'auth.refresh_token',
  LOGOUT: 'auth.logout',
  REFRESH_LOCK: 'auth.refresh_lock',

  // 💤 idle timeout
  LAST_ACTIVITY: 'auth.last_activity',

  // ⚠️ warning session
  SESSION_WARNING: 'auth.session_warning',
} as const;


/* ================================
   Types
================================ */

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, access_token: string, refresh_token: string) => void;
  setAccessToken: (access_token: string | null) => void;
  logout: () => void;

  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (roleCode: RoleCode) => boolean;
  isSuperUser: () => boolean;
}

/* ====================================
    Store
=====================================*/

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,

      setAuth: (user, access_token, refresh_token) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);
        set({ 
          user,
          access_token, 
          refresh_token, 
          isAuthenticated: true 
        });
      },

      setAccessToken: (access_token: string | null) => {
        if(access_token){
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access_token);
        }else {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        }
        set({ 
          access_token,
          isAuthenticated: Boolean(access_token) 
        });
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

        // 🔔 signal global multi-onglets
        localStorage.setItem(STORAGE_KEYS.LOGOUT, Date.now().toString());
        set({
          user: null,
          access_token: null,
          refresh_token: null,
          isAuthenticated: false,
        })
      },

      hasPermission: (resource, action) => {
        const { user } = get();
        if (!user) return false;

        return user.roles?.some(
          (role) => role.permissions?.[resource]?.[action] === true,
        ) ?? false;
      },

      hasRole: (roleCode) => {
        const { user } = get();
        if (!user) return false;
        
        return user.roles?.some((role) => role.code === roleCode) ?? false;
      },
      isSuperUser: () => {
        const { user } = get();
        if (!user) return false;
        
        return user.is_superuser;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // On page reload, check if the persisted access token is expired.
        // If so, clear auth state to avoid firing API calls with a dead token
        // (which would trigger an unnecessary refresh cycle).
        if (state.isAuthenticated && isTokenExpired(state.access_token)) {
          state.logout();
        }
      },
    },
  ),
);
