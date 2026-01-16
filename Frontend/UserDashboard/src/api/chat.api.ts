import { api } from './axios';

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

export interface StartChatRequest {
  subject: string;
  user_name: string;
  email: string;
}

// Start a new chat
export const startChat = (data: StartChatRequest) => 
  api.post<{ data: ChatRoom }>('/chat/start', data);

// Get active chat room
export const getActiveChat = () => 
  api.get<{ data: ChatRoom }>('/chat/active');

// Get chat messages
export const getChatMessages = (roomId: string) => 
  api.get<{ data: ChatMessage[] }>(`/chat/${roomId}/messages`);

// Close chat
export const closeChat = (roomId: string) => 
  api.post<{ data: null }>(`/chat/${roomId}/close`);

// WebSocket URL builder
export const getChatWebSocketUrl = (roomId: string, userName: string) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';
  const wsUrl = baseUrl.replace('http', 'ws');
  const token = localStorage.getItem('access_token') || '';
  const tenantId = localStorage.getItem('tenant_id') || '';
  return `${wsUrl}/chat/${roomId}/ws?name=${encodeURIComponent(userName)}&token=${token}&tenant_id=${tenantId}`;
};
