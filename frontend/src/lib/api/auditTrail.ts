import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  AuditEntry,
  AuditTrailFilters,
  IntegrityVerification,
  ReportFormat,
} from '@/types';

export interface AuditExportParams {
  format: ReportFormat;
  user_id?: string;
  event_type?: AuditEntry['event_type'];
  table_name?: string;
  from_timestamp?: string;
  to_timestamp?: string;
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
    const { data } = await apiClient.get<ApiResponse<AuditEntry>>(
      `/audit-trail/${id}`,
    );
    return data.data;
  },

  getByEntity: async (entityType: string, entityId: string) => {
    const { data } = await apiClient.get<ApiResponse<AuditEntry[]>>(
      `/audit-trail/entity/${entityType}/${entityId}`,
    );
    return data.data;
  },

  verifyIntegrity: async () => {
    const { data } = await apiClient.get<ApiResponse<IntegrityVerification>>(
      '/audit-trail/verify-integrity',
    );
    return data.data;
  },

  export: async (params: AuditExportParams) => {
    const response = await apiClient.get('/audit-trail/export', {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};
