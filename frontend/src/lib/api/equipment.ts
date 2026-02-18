import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Equipment,
  CreateEquipmentRequest,
  EquipmentFilters,
  AuditEntry,
} from '@/types';

export interface UpdateEquipmentRequest {
  container_id?: string;
  operational_status?: Equipment['operational_status'];
  status?: Equipment['status'];
  last_calibration_date?: string;
  next_calibration_date?: string;
  description?: string;
}

export const equipmentApi = {
  getAll: async (params?: EquipmentFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Equipment>>>(
      '/equipment',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Equipment>>(
      `/equipment/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateEquipmentRequest) => {
    const { data } = await apiClient.post<ApiResponse<Equipment>>(
      '/equipment',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateEquipmentRequest) => {
    const { data } = await apiClient.put<ApiResponse<Equipment>>(
      `/equipment/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/equipment/${id}`);
  },

  getCalibrationDue: async (params?: { due_before?: string; site_id?: string }) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Equipment>>>(
      '/equipment/calibration-due',
      { params },
    );
    return data.data;
  },

  getHistory: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AuditEntry[]>>(
      `/equipment/${id}/history`,
    );
    return data.data;
  },
};
