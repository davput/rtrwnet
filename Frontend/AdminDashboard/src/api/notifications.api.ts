import api from "./axios";
import type { ApiResponse } from "@/types";

export interface AdminNotification {
  id: string;
  admin_id?: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: AdminNotification[];
  total: number;
  page: number;
  per_page: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

// Get admin notifications
export const getNotifications = (params?: {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}) => api.get<ApiResponse<NotificationListResponse>>("/admin/notifications", { params });

// Get unread count
export const getUnreadCount = () =>
  api.get<ApiResponse<UnreadCountResponse>>("/admin/notifications/unread-count");

// Mark notification as read
export const markAsRead = (id: string) =>
  api.put<ApiResponse<null>>(`/admin/notifications/${id}/read`);

// Mark all notifications as read
export const markAllAsRead = () =>
  api.post<ApiResponse<null>>("/admin/notifications/mark-all-read");

// Delete notification
export const deleteNotification = (id: string) =>
  api.delete<ApiResponse<null>>(`/admin/notifications/${id}`);
