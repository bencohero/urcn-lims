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
} as const;


/* ================================
   Types
================================ */

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
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
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        set({ 
          user,
          accessToken, 
          refreshToken, 
          isAuthenticated: true 
        });
      },

      setAccessToken: (accessToken) => {
        if(accessToken){
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        }else {
          localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        }
        set({ 
          accessToken,
          isAuthenticated: Boolean(accessToken) 
        });
      },

      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

        // 🔔 signal global multi-onglets
        localStorage.setItem(STORAGE_KEYS.LOGOUT, Date.now().toString());
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
