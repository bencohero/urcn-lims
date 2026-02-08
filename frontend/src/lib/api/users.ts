import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  PaginationParams,
  RoleCode,
  ChangePasswordRequest,
} from '@/types';

export interface UserFilters extends PaginationParams {
  role?: RoleCode;
  site_id?: string;
  is_active?: boolean;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
  roles: RoleCode[];
  site_ids: string[];
}

export interface UpdateUserRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  roles?: RoleCode[];
  site_ids?: string[];
}

export interface AdminResetPasswordRequest {
  new_password: string;
  confirm_password: string;
}

export const usersApi = {
  getAll: async (params?: UserFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
      '/users',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<User>>(
      `/users/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateUserRequest) => {
    const { data } = await apiClient.post<ApiResponse<User>>(
      '/users',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateUserRequest) => {
    const { data } = await apiClient.put<ApiResponse<User>>(
      `/users/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },

  changePassword: async (id: string, payload: ChangePasswordRequest) => {
    const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
      `/users/${id}/change-password`,
      payload,
    );
    return data.data;
  },

  resetPassword: async (id: string, payload: AdminResetPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      `/users/${id}/reset-password`,
      payload,
    );
    return data.data;
  },

  toggleActive: async (id: string) => {
    const { data } = await apiClient.put<ApiResponse<User>>(
      `/users/${id}/toggle-active`,
    );
    return data.data;
  },
};
