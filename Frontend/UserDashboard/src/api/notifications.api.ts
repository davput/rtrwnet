import { api } from './axios';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id?: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  per_page: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Get notifications
export const getNotifications = async (params?: {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}): Promise<ApiResponse<NotificationListResponse>> => {
  return api.get('/notifications', { params });
};

// Get unread count
export const getUnreadCount = async (): Promise<ApiResponse<UnreadCountResponse>> => {
  return api.get('/notifications/unread-count');
};

// Mark notification as read
export const markAsRead = async (id: string): Promise<ApiResponse<null>> => {
  return api.put(`/notifications/${id}/read`);
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<ApiResponse<null>> => {
  return api.post('/notifications/mark-all-read');
};

// Delete notification
export const deleteNotification = async (id: string): Promise<ApiResponse<null>> => {
  return api.delete(`/notifications/${id}`);
};
