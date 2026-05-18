import { apiClient } from './client';
import type { ApiResponse, DashboardStatistics } from '@/types';

export type DownloadableReportType = 'inventory' | 'movements' | 'access-requests' | 'audit-trail';

export interface DownloadReportParams {
  format: 'pdf' | 'excel' | 'csv';
  study_id?: string;
  site_id?: string;
  from_date?: string;
  to_date?: string;
  group_by?: string;
  status?: string;
  table_name?: string;
}

export const reportsApi = {
  download: async (reportType: DownloadableReportType, params: DownloadReportParams): Promise<Blob> => {
    const response = await apiClient.get(`/reports/${reportType}`, {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getStatistics: async (params?: {
    study_id?: string;
    site_id?: string;
    period?: 'day' | 'week' | 'month' | 'year';
  }) => {
    const { data } = await apiClient.get<ApiResponse<DashboardStatistics>>(
      '/reports/statistics',
      { params },
    );
    return data.data;
  },
};
