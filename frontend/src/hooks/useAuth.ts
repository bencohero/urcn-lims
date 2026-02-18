import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types';

/**
 * Fetches the current authenticated user's profile.
 * Only enabled when the user is authenticated (has a valid token in store).
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Logs in the user with username/password (and optional MFA code).
 * On success, stores the user, access token, and refresh token in the auth store,
 * then invalidates the current user query so it refetches.
 */
export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.access_token, data.refresh_token);
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Logs out the current user.
 * Calls the server-side logout endpoint, then clears local auth state
 * and removes all cached queries.
 */
export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: () => {
      // Even if server logout fails, clear local state
      logout();
      queryClient.clear();
    },
  });
}

/**
 * Changes the password for the currently authenticated user.
 * Requires the current password and a new password with confirmation.
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) =>
      authApi.changePassword(payload),
  });
}

/**
 * Initiates the forgot-password flow by sending a reset email.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) =>
      authApi.forgotPassword(payload),
  });
}

/**
 * Resets the password using a token received via email.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authApi.resetPassword(payload),
  });
}
