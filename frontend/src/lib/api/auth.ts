import { apiClient } from './client';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  User,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types';

export const authApi = {
  login: async (payload: LoginRequest) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      payload,
    );
    return data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  me: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },

  refreshToken: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<RefreshResponse>>(
      '/auth/refresh',
      { refresh_token: refreshToken },
    );
    return data.data;
  },

  changePassword: async (payload: ChangePasswordRequest) => {
    const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
      '/auth/change-password',
      payload,
    );
    return data.data;
  },

  forgotPassword: async (payload: ForgotPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      payload,
    );
    return data.data;
  },

  resetPassword: async (payload: ResetPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      payload,
    );
    return data.data;
  },
};
