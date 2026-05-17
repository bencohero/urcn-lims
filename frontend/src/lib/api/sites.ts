import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Site,
  SiteFilters,
  StorageLocation,
} from '@/types';

export interface CreateSiteRequest {
  study_id: string;
  site_number: string;
  name: string;
  country: string;
  city: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  has_offline_capability: boolean;
  timezone?: string;
  activation_date?: string;
  principal_investigator_id?: string;
}

export interface UpdateSiteRequest {
  name?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  status?: Site['status'];
  has_offline_capability?: boolean;
  timezone?: string;
  principal_investigator_id?: string | null;
}

export interface SiteCapacity {
  site_id: string;
  site_name: string;
  total_locations: number;
  total_capacity_cubic_meters: number;
  current_usage_percent: number;
  locations: Array<{
    id: string;
    name: string;
    code: string;
    capacity_cubic_meters: number;
    current_usage_percent: number;
    status: string;
  }>;
}

export interface SiteMember {
  id: string;
  name: string;
  email: string;
}

export const sitesApi = {
  getAll: async (params?: SiteFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Site>>>(
      '/sites',
      { params },
    );
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Site>>(
      `/sites/${id}`,
    );
    return data.data;
  },

  create: async (payload: CreateSiteRequest) => {
    const { data } = await apiClient.post<ApiResponse<Site>>(
      '/sites',
      payload,
    );
    return data.data;
  },

  update: async (id: string, payload: UpdateSiteRequest) => {
    const { data } = await apiClient.put<ApiResponse<Site>>(
      `/sites/${id}`,
      payload,
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/sites/${id}`);
  },

  getLocations: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<StorageLocation[]>>(
      `/sites/${id}/locations`,
    );
    return data.data;
  },

  getCapacity: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<SiteCapacity>>(
      `/sites/${id}/capacity`,
    );
    return data.data;
  },

  getMembers: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<SiteMember[]>>(
      `/sites/${id}/members`,
    );
    return data.data;
  },
};
