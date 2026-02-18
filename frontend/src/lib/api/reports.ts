import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  ReportType,
  ReportRequest,
  ScheduledReport,
  DashboardStatistics,
} from '@/types';

export interface CreateScheduledReportRequest {
  report_type: ReportType;
  format: ScheduledReport['format'];
  schedule: string;
  recipients: string[];
  filters: Record<string, string>;
}

export interface UpdateScheduledReportRequest {
  format?: ScheduledReport['format'];
  schedule?: string;
  recipients?: string[];
  filters?: Record<string, string>;
  is_active?: boolean;
}

export interface GeneratedReport {
  id: string;
  report_type: ReportType;
  format: string;
  download_url: string;
  generated_at: string;
  expires_at: string;
  file_size_bytes: number;
}

export const reportsApi = {
  generate: async (reportType: ReportType, payload: ReportRequest) => {
    const { data } = await apiClient.post<ApiResponse<GeneratedReport>>(
      `/reports/${reportType}`,
      payload,
    );
    return data.data;
  },

  download: async (reportType: ReportType, params: ReportRequest) => {
    const response = await apiClient.get(`/reports/${reportType}/download`, {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getScheduled: async () => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<ScheduledReport>>>(
      '/reports/scheduled',
    );
    return data.data;
  },

  schedule: async (payload: CreateScheduledReportRequest) => {
    const { data } = await apiClient.post<ApiResponse<ScheduledReport>>(
      '/reports/scheduled',
      payload,
    );
    return data.data;
  },

  updateSchedule: async (id: string, payload: UpdateScheduledReportRequest) => {
    const { data } = await apiClient.put<ApiResponse<ScheduledReport>>(
      `/reports/scheduled/${id}`,
      payload,
    );
    return data.data;
  },

  deleteSchedule: async (id: string) => {
    await apiClient.delete(`/reports/scheduled/${id}`);
  },

  getStatistics: async (params?: { study_id?: string; site_id?: string; from_date?: string; to_date?: string }) => {
    const { data } = await apiClient.get<ApiResponse<DashboardStatistics>>(
      '/reports/statistics',
      { params },
    );
    return data.data;
  },
};
