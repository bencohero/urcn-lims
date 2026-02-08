import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Document,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentFilters,
  AuditEntry,
  Movement,
} from '@/types';

export const documentsApi = {
  getAll: async (params?: DocumentFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Document>>>(
      '/documents',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Document>>(
      `/documents/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateDocumentRequest) => {
    const { data } = await apiClient.post<ApiResponse<Document>>(
      '/documents',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateDocumentRequest) => {
    const { data } = await apiClient.put<ApiResponse<Document>>(
      `/documents/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/documents/${id}`);
  },

  getHistory: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AuditEntry[]>>(
      `/documents/${id}/history`,
    );
    return data.data;
  },

  getMovements: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Movement[]>>(
      `/documents/${id}/movements`,
    );
    return data.data;
  },
};
