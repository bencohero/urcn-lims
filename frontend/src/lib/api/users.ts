import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  PaginationParams,
  RoleCode,
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
  is_active?: boolean;
  mfa_enabled?: boolean;
}

export interface AdminResetPasswordRequest {
  new_password: string;
}

export interface SiteRoleAssignment {
  id: string;
  site_id: string;
  site_number: string;
  site_name: string;
  role_id: string;
  role_code: string;
  role_name: string;
  is_primary: boolean;
  assigned_at: string;
  is_active: boolean;
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
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  create: async (payload: CreateUserRequest) => {
    const { data } = await apiClient.post<ApiResponse<User>>('/users', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateUserRequest) => {
    const { data } = await apiClient.put<ApiResponse<User>>(`/users/${id}`, payload);
    return data.data;
  },

  deactivate: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<User>>(`/users/${id}`);
    return data.data;
  },

  activate: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<User>>(`/users/${id}/activate`);
    return data.data;
  },

  unlock: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<User>>(`/users/${id}/unlock`);
    return data.data;
  },

  resetPassword: async (id: string, payload: AdminResetPasswordRequest) => {
    const { data } = await apiClient.post<ApiResponse<User>>(
      `/users/${id}/reset-password`,
      payload,
    );
    return data.data;
  },

  getSiteRoles: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<SiteRoleAssignment[]>>(
      `/users/${id}/site-roles`,
    );
    return data.data;
  },

  assignSiteRole: async (id: string, payload: { site_id: string; role_id: string; is_primary?: boolean }) => {
    const { data } = await apiClient.post<ApiResponse<SiteRoleAssignment>>(
      `/users/${id}/site-roles`,
      payload,
    );
    return data.data;
  },

  unassignSiteRole: async (id: string, payload: { site_id: string; role_id: string }) => {
    await apiClient.delete(`/users/${id}/site-roles`, { data: payload });
  },

  changePassword: async (id: string, payload: { current_password: string; new_password: string; confirm_password: string }) => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      `/users/${id}/change-password`,
      payload,
    );
    return data.data;
  },
};
