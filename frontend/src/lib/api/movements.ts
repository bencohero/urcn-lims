import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types';

export type BackendMovementType =
  | 'INTERNAL_TRANSFER'
  | 'OUTGOING'
  | 'INCOMING'
  | 'ADJUSTMENT';

export interface FullMovement {
  id: string;
  stored_item_id: string;
  movement_type: BackendMovementType;
  from_container?: { id: string; name: string; code: string };
  to_container?: { id: string; name: string; code: string };
  from_location?: { id: string; name: string; code: string };
  to_location?: { id: string; name: string; code: string };
  performed_by?: { id: string; username: string; full_name: string };
  approver?: { id: string; username: string; full_name: string };
  notes?: string;
  expected_return_date?: string;
  return_date?: string;
  stored_item?: {
    id: string;
    description: string;
    item_type: string;
    status: string;
    internal_code?: string;
  };
  movement_date: string;
  created_at: string;
}

export interface CreateMovementRequest {
  stored_item_id: string;
  movement_type: BackendMovementType;
  from_container_id?: string;
  to_container_id?: string;
  from_location_id?: string;
  to_location_id?: string;
  performed_by: string;
  approver_id?: string;
  notes?: string;
  expected_return_date?: string;
}

export interface MovementFilters extends PaginationParams {
  stored_item_id?: string;
  movement_type?: BackendMovementType;
  performed_by_id?: string;
  from_date?: string;
  to_date?: string;
}

export const movementsApi = {
  getAll: async (params?: MovementFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<FullMovement>>>(
      '/movements',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<FullMovement>>(`/movements/${id}`);
    return data.data;
  },

  create: async (payload: CreateMovementRequest) => {
    const { data } = await apiClient.post<ApiResponse<FullMovement>>('/movements', payload);
    return data.data;
  },

  getOverdue: async () => {
    const { data } = await apiClient.get<ApiResponse<FullMovement[]>>('/movements/overdue');
    return data.data;
  },

  recordReturn: async (id: string) => {
    const { data } = await apiClient.post<ApiResponse<FullMovement>>(
      `/movements/${id}/return`,
    );
    return data.data;
  },
};
