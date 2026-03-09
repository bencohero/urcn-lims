import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse } from '@/types';

export interface RoleDetail {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: Record<string, Record<string, boolean>>;
  is_system_role: boolean;
}

export const rolesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<RoleDetail>>>('/roles');
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<RoleDetail>>(`/roles/${id}`);
    return data.data;
  },
};
