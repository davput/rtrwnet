import { apiClient } from './client';

export interface Ticket {
  id: string;
  customer_id: string;
  customer_name: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketData {
  customer_id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const ticketService = {
  async getAll(params?: {
    customer_id?: string;
    status?: string;
    priority?: string;
  }): Promise<Ticket[]> {
    const response = await apiClient.get('/tickets', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<Ticket> {
    const response = await apiClient.get(`/tickets/${id}`);
    return response.data;
  },

  async create(data: CreateTicketData): Promise<Ticket> {
    const response = await apiClient.post('/tickets', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateTicketData>): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: string): Promise<Ticket> {
    const response = await apiClient.put(`/tickets/${id}/status`, { status });
    return response.data;
  },
};
