import api from "./axios";
import type { ApiResponse } from "@/types";

export interface ChatRoom {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  admin_id?: string;
  admin_name?: string;
  status: 'waiting' | 'active' | 'closed';
  subject?: string;
  last_message?: string;
  last_message_at?: string;
  created_at: string;
  closed_at?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'user' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

// Get waiting chats
export const getWaitingChats = () =>
  api.get<ApiResponse<ChatRoom[]>>("/admin/chats/waiting");

// Get all active chats
export const getAllActiveChats = () =>
  api.get<ApiResponse<ChatRoom[]>>("/admin/chats/active");

// Get my chats (assigned to current admin)
export const getMyChats = () =>
  api.get<ApiResponse<ChatRoom[]>>("/admin/chats/my");

// Join a chat room
export const joinChat = (roomId: string) =>
  api.post<ApiResponse<ChatRoom>>(`/admin/chats/${roomId}/join`);

// Get chat messages
export const getChatMessages = (roomId: string) =>
  api.get<ApiResponse<ChatMessage[]>>(`/admin/chats/${roomId}/messages`);

// Close chat
export const closeChat = (roomId: string) =>
  api.post<ApiResponse<null>>(`/admin/chats/${roomId}/close`);

// WebSocket URL builder
export const getChatWebSocketUrl = (roomId: string, adminName: string) => {
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8089/api/v1";
  const wsUrl = baseUrl.replace('http', 'ws');
  const token = localStorage.getItem('admin_token') || '';
  return `${wsUrl}/admin/chats/${roomId}/ws?name=${encodeURIComponent(adminName)}&token=${token}`;
};
