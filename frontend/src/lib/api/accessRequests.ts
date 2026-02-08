import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  AccessRequest,
  CreateAccessRequestRequest,
  ApproveAccessRequestRequest,
  RejectAccessRequestRequest,
  FulfillAccessRequestRequest,
  ReturnAccessRequestRequest,
  ExtendAccessRequestRequest,
  AccessRequestFilters,
} from '@/types';

export const accessRequestsApi = {
  getAll: async (params?: AccessRequestFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<AccessRequest>>>(
      '/access-requests',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AccessRequest>>(
      `/access-requests/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateAccessRequestRequest) => {
    const { data } = await apiClient.post<ApiResponse<AccessRequest>>(
      '/access-requests',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: Partial<CreateAccessRequestRequest>) => {
    const { data } = await apiClient.put<ApiResponse<AccessRequest>>(
      `/access-requests/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/access-requests/${id}`);
  },

  approve: async (id: string, payload: ApproveAccessRequestRequest) => {
    const { data } = await apiClient.post<ApiResponse<AccessRequest>>(
      `/access-requests/${id}/approve`,
      payload,
    );
    return data.data;
  },

  reject: async (id: string, payload: RejectAccessRequestRequest) => {
    const { data } = await apiClient.post<ApiResponse<AccessRequest>>(
      `/access-requests/${id}/reject`,
      payload,
    );
    return data.data;
  },

  fulfill: async (id: string, payload: FulfillAccessRequestRequest) => {
    const { data } = await apiClient.post<ApiResponse<AccessRequest>>(
      `/access-requests/${id}/fulfill`,
      payload,
    );
    return data.data;
  },

  return: async (id: string, payload: ReturnAccessRequestRequest) => {
    const { data } = await apiClient.post<ApiResponse<AccessRequest>>(
      `/access-requests/${id}/return`,
      payload,
    );
    return data.data;
  },

  extend: async (id: string, payload: ExtendAccessRequestRequest) => {
    const { data } = await apiClient.post<ApiResponse<AccessRequest>>(
      `/access-requests/${id}/extend`,
      payload,
    );
    return data.data;
  },
};
