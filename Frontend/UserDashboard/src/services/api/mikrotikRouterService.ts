import { apiClient } from './client';

export interface MikrotikRouter {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  location: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateMikrotikRouterData {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  location: string;
}

export const mikrotikRouterService = {
  async getAll(): Promise<MikrotikRouter[]> {
    const response = await apiClient.get('/mikrotik/routers');
    return response.data.data;
  },

  async getById(id: string): Promise<MikrotikRouter> {
    const response = await apiClient.get(`/mikrotik/routers/${id}`);
    return response.data;
  },

  async create(data: CreateMikrotikRouterData): Promise<MikrotikRouter> {
    const response = await apiClient.post('/mikrotik/routers', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateMikrotikRouterData>): Promise<MikrotikRouter> {
    const response = await apiClient.put(`/mikrotik/routers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/mikrotik/routers/${id}`);
  },
};
