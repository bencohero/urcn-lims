import { apiClient } from './client';
import type { ApiResponse, PaginatedResponse, AuditEntry, AuditTrailFilters, IntegrityVerification } from '@/types';

export interface AuditStatistics {
  total_entries: number;
  by_event_type: Record<string, number>;
  by_table: Record<string, number>;
  top_users: Array<{ username: string; actions: number }>;
}

export const auditTrailApi = {
  getAll: async (params?: AuditTrailFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<AuditEntry>>>(
      '/audit-trail',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AuditEntry>>(`/audit-trail/${id}`);
    return data.data;
  },

  getByRecord: async (tableName: string, recordId: string) => {
    const { data } = await apiClient.get<ApiResponse<{
      table_name: string;
      record_id: string;
      history: AuditEntry[];
      total_entries: number;
    }>>(`/audit-trail/record/${tableName}/${recordId}`);
    return data.data;
  },

  verifyIntegrity: async (limit = 1000) => {
    const { data } = await apiClient.get<ApiResponse<IntegrityVerification>>(
      '/audit-trail/verify-integrity',
      { params: { limit } },
    );
    return data.data;
  },

  getStatistics: async (params?: { from_timestamp?: string; to_timestamp?: string }) => {
    const { data } = await apiClient.get<ApiResponse<AuditStatistics>>(
      '/audit-trail/statistics',
      { params },
    );
    return data.data;
  },

  export: async (params: {
    format: 'pdf' | 'excel' | 'csv';
    from_date?: string;
    to_date?: string;
    table_name?: string;
  }) => {
    const response = await apiClient.get('/reports/audit-trail', {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
