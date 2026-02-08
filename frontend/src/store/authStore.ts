import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RoleCode } from '@/types';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      setAccessToken: (accessToken) => set({ accessToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

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
