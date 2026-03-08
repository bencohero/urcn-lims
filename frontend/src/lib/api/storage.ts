import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  StorageLocation,
  Container,
  PaginationParams,
} from '@/types';

export interface CreateStorageLocationRequest {
  site_id: string;
  name: string;
  code: string;
  location_type: 'ROOM' | 'ZONE' | 'AREA';
  parent_location_id?: string;
  floor?: string;
  building?: string;
  temperature_controlled?: boolean;
  temperature_min?: number;
  temperature_max?: number;
  access_restricted?: boolean;
  capacity_cubic_meters?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateContainerRequest {
  location_id: string;
  container_type: Container['container_type'];
  name: string;
  code: string;
  capacity_items: number;
  dimensions_cm?: string;
  locked?: boolean;
  barcode?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface StorageLocationFilters extends PaginationParams {
  site_id?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  parent_location_id?: string;
}

export interface ContainerFilters extends PaginationParams {
  location_id?: string;
  container_type?: Container['container_type'];
  status?: Container['status'];
}

export const storageApi = {
  getLocations: async (params?: StorageLocationFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<StorageLocation>>>(
      '/storage-locations',
      { params },
    );
    return data.data;
  },

  getLocationById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<StorageLocation>>(
      `/storage-locations/${id}`,
    );
    return data.data;
  },

  createLocation: async (payload: CreateStorageLocationRequest) => {
    const { data } = await apiClient.post<ApiResponse<StorageLocation>>(
      '/storage-locations',
      payload,
    );
    return data.data;
  },

  updateLocation: async (id: string, payload: Partial<CreateStorageLocationRequest>) => {
    const { data } = await apiClient.put<ApiResponse<StorageLocation>>(
      `/storage-locations/${id}`,
      payload,
    );
    return data.data;
  },

  getContainers: async (params?: ContainerFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Container>>>(
      '/containers',
      { params },
    );
    return data.data;
  },

  getContainerById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Container>>(`/containers/${id}`);
    return data.data;
  },

  createContainer: async (payload: CreateContainerRequest) => {
    const { data } = await apiClient.post<ApiResponse<Container>>('/containers', payload);
    return data.data;
  },

  updateContainer: async (id: string, payload: Partial<CreateContainerRequest>) => {
    const { data } = await apiClient.put<ApiResponse<Container>>(
      `/containers/${id}`,
      payload,
    );
    return data.data;
  },
};
