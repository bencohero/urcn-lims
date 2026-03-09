import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface SystemSetting {
  id: string;
  category: string;
  setting_key: string;
  setting_value: string | number | boolean | null;
  data_type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'JSON';
  description?: string;
  is_sensitive: boolean;
  is_editable: boolean;
}

export const systemSettingsApi = {
  getAll: async (category?: string) => {
    const { data } = await apiClient.get<ApiResponse<SystemSetting[]>>(
      '/system-settings',
      { params: category ? { category } : undefined },
    );
    return data.data;
  },

  update: async (id: string, value: unknown) => {
    const { data } = await apiClient.put<ApiResponse<SystemSetting>>(
      `/system-settings/${id}`,
      { value },
    );
    return data.data;
  },
};
