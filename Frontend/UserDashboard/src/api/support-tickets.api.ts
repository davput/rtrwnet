import { api } from './axios';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  user_id?: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  assigned_to?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  replies?: SupportTicketReply[];
  reply_count?: number;
}

export interface SupportTicketReply {
  id: string;
  ticket_id: string;
  user_id?: string;
  admin_id?: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
}

export interface SupportTicketListResponse {
  tickets: SupportTicket[];
  total: number;
  page: number;
  per_page: number;
}

export interface SupportTicketStats {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Get list of support tickets
export const getSupportTickets = async (params?: {
  page?: number;
  per_page?: number;
  status?: string;
}): Promise<ApiResponse<SupportTicketListResponse>> => {
  return api.get('/support-tickets', { params });
};

// Get support ticket stats
export const getSupportTicketStats = async (): Promise<ApiResponse<SupportTicketStats>> => {
  return api.get('/support-tickets/stats');
};

// Get single support ticket with replies
export const getSupportTicket = async (id: string): Promise<ApiResponse<SupportTicket>> => {
  return api.get(`/support-tickets/${id}`);
};

// Create new support ticket
export const createSupportTicket = async (
  data: CreateSupportTicketRequest
): Promise<ApiResponse<SupportTicket>> => {
  return api.post('/support-tickets', data);
};

// Add reply to support ticket
export const addSupportTicketReply = async (
  ticketId: string,
  message: string
): Promise<ApiResponse<SupportTicketReply>> => {
  return api.post(`/support-tickets/${ticketId}/reply`, { message });
};
