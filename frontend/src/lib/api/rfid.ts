import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  RFIDTag,
  EncodeTagRequest,
  ReadTagRequest,
  ReadTagResponse,
  BulkReadRequest,
  BulkReadResponse,
  RFIDFilters,
  AuditEntry,
} from '@/types';

export interface InventoryReport {
  location_id: string;
  location_name: string;
  scan_date: string;
  total_expected: number;
  total_found: number;
  total_missing: number;
  total_unexpected: number;
  items: Array<{
    epc: string;
    item_id: string;
    item_type: string;
    description: string;
    status: 'FOUND' | 'MISSING' | 'UNEXPECTED';
  }>;
}

export const rfidApi = {
  getTags: async (params?: RFIDFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<RFIDTag>>>(
      '/rfid/tags',
      { params },
    );
    return data.data;
  },

  getTagById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<RFIDTag>>(
      `/rfid/tags/${id}`,
    );
    return data.data;
  },

  encodeTag: async (payload: EncodeTagRequest) => {
    const { data } = await apiClient.post<ApiResponse<RFIDTag>>(
      '/rfid/tags',
      payload,
    );
    return data.data;
  },

  readTag: async (payload: ReadTagRequest) => {
    const { data } = await apiClient.post<ApiResponse<ReadTagResponse>>(
      '/rfid/read',
      payload,
    );
    return data.data;
  },

  bulkRead: async (payload: BulkReadRequest) => {
    const { data } = await apiClient.post<ApiResponse<BulkReadResponse>>(
      '/rfid/bulk-read',
      payload,
    );
    return data.data;
  },

  getTagHistory: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AuditEntry[]>>(
      `/rfid/tags/${id}/history`,
    );
    return data.data;
  },

  getInventoryReport: async (params: { location_id: string; site_id?: string }) => {
    const { data } = await apiClient.get<ApiResponse<InventoryReport>>(
      '/rfid/inventory-report',
      { params },
    );
    return data.data;
  },
};
