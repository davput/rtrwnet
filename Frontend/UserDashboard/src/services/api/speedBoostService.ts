import { apiClient } from './client';

export interface SpeedBoostRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  current_plan: string;
  boost_plan: string;
  duration_days: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  request_date: string;
  start_date: string | null;
  end_date: string | null;
  notes: string;
}

export interface CreateSpeedBoostData {
  customer_id: string;
  boost_plan_id: string;
  duration_days: number;
  notes?: string;
}

export const speedBoostService = {
  async getAll(params?: { status?: string }): Promise<SpeedBoostRequest[]> {
    const response = await apiClient.get('/speed-boost', { params });
    return response.data.data;
  },

  async getById(id: string): Promise<SpeedBoostRequest> {
    const response = await apiClient.get(`/speed-boost/${id}`);
    return response.data;
  },

  async create(data: CreateSpeedBoostData): Promise<SpeedBoostRequest> {
    const response = await apiClient.post('/speed-boost', data);
    return response.data;
  },

  async approve(id: string): Promise<{ message: string; start_date: string; end_date: string }> {
    const response = await apiClient.post(`/speed-boost/${id}/approve`);
    return response.data;
  },

  async reject(id: string, reason: string): Promise<void> {
    await apiClient.post(`/speed-boost/${id}/reject`, { reason });
  },

  async activate(id: string): Promise<void> {
    await apiClient.post(`/speed-boost/${id}/activate`);
  },
};
