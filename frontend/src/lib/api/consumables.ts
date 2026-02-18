import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Consumable,
  CreateConsumableRequest,
  ConsumableFilters,
  AuditEntry,
} from '@/types';

export interface UpdateConsumableRequest {
  container_id?: string;
  quantity?: number;
  status?: Consumable['status'];
  storage_conditions?: string;
  description?: string;
}

export interface StockAlert {
  id: string;
  consumable_id: string;
  consumable: {
    catalog_number: string;
    lot_number: string;
    description?: string;
  };
  alert_type: 'LOW_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';
  message: string;
  severity: 'WARNING' | 'CRITICAL';
  created_at: string;
}

export const consumablesApi = {
  getAll: async (params?: ConsumableFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Consumable>>>(
      '/consumables',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Consumable>>(
      `/consumables/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateConsumableRequest) => {
    const { data } = await apiClient.post<ApiResponse<Consumable>>(
      '/consumables',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateConsumableRequest) => {
    const { data } = await apiClient.put<ApiResponse<Consumable>>(
      `/consumables/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/consumables/${id}`);
  },

  getStockAlerts: async (params?: { site_id?: string; severity?: 'WARNING' | 'CRITICAL' }) => {
    const { data } = await apiClient.get<ApiResponse<StockAlert[]>>(
      '/consumables/stock-alerts',
      { params },
    );
    return data.data;
  },

  getHistory: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AuditEntry[]>>(
      `/consumables/${id}/history`,
    );
    return data.data;
  },
};
