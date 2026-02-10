import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RoleCode } from '@/types';


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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
