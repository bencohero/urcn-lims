import { apiClient } from './client';
import type { ApiResponse } from '@/types';

export interface SearchParams {
  q: string;
  types?: string; // "document,equipment,consumable"
  study_id?: string;
  site_id?: string;
}

export interface SearchResultItem {
  id: string;
  type: 'document' | 'equipment' | 'consumable';
  title: string;
  subtitle?: string;
  status?: string;
  study?: string;
  site?: string;
}

export interface SearchResults {
  documents: SearchResultItem[];
  equipment: SearchResultItem[];
  consumables: SearchResultItem[];
}

export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResults> => {
    const { data } = await apiClient.get<ApiResponse<SearchResults>>('/search', { params });
    return data.data;
  },
};
