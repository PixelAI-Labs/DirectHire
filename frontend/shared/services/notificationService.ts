import { apiClient } from './apiClient';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  related_id?: string;
  created_at: string;
}

export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get<Notification[]>('/api/notifications');
    return response.data;
  },
  
  getUnreadCount: async () => {
    const response = await apiClient.get<{ unread_count: number }>('/api/notifications/unread-count');
    return response.data.unread_count;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put(`/api/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post('/api/notifications/mark-all-read');
    return response.data;
  }
};
