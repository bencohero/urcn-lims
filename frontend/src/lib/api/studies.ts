import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Study,
  StudyFilters,
} from '@/types';

export interface CreateStudyRequest {
  protocol_number: string;
  title: string;
  sponsor: string;
  phase: Study['phase'];
  therapeutic_area: string;
  start_date: string;
  end_date: string;
  estimated_enrollment: number;
  retention_period_years: number;
  description?: string;
  status?: Study['status'];
}

export interface UpdateStudyRequest {
  title?: string;
  sponsor?: string;
  phase?: Study['phase'];
  therapeutic_area?: string;
  start_date?: string;
  end_date?: string;
  estimated_enrollment?: number;
  retention_period_years?: number;
  description?: string;
  status?: Study['status'];
}

export const studiesApi = {
  getAll: async (params?: StudyFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Study>>>(
      '/studies',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Study>>(
      `/studies/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateStudyRequest) => {
    const { data } = await apiClient.post<ApiResponse<Study>>(
      '/studies',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateStudyRequest) => {
    const { data } = await apiClient.put<ApiResponse<Study>>(
      `/studies/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/studies/${id}`);
  },
};
