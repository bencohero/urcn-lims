import { apiClient } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Notification,
  NotificationFilters,
} from '@/types';

export interface UnreadCount {
  count: number;
}

export const notificationsApi = {
  getAll: async (params?: NotificationFilters) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>(
      '/notifications',
      { params },
    );
    return data.data;
  },

  getUnreadCount: async () => {
    const { data } = await apiClient.get<ApiResponse<UnreadCount>>(
      '/notifications/unread-count',
    );
    return data.data;
  },

  markAsRead: async (id: string) => {
    const { data } = await apiClient.put<ApiResponse<Notification>>(
      `/notifications/${id}/read`,
    );
    return data.data;
  },

  markAllAsRead: async () => {
    const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
      '/notifications/mark-all-read',
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/notifications/${id}`);
  },
};
