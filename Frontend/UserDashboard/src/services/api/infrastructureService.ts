import { apiClient } from './client';

export interface InfrastructureItem {
  id: string;
  name: string;
  type: 'cable' | 'equipment' | 'tool' | 'other';
  quantity: number;
  unit: string;
  location: string;
  notes: string;
}

export interface CreateInfrastructureData {
  name: string;
  type: string;
  quantity: number;
  unit: string;
  location: string;
  notes?: string;
}

export const infrastructureService = {
  async getAll(): Promise<InfrastructureItem[]> {
    const response = await apiClient.get('/infrastructure');
    return response.data.data;
  },

  async getById(id: string): Promise<InfrastructureItem> {
    const response = await apiClient.get(`/infrastructure/${id}`);
    return response.data;
  },

  async create(data: CreateInfrastructureData): Promise<InfrastructureItem> {
    const response = await apiClient.post('/infrastructure', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateInfrastructureData>): Promise<InfrastructureItem> {
    const response = await apiClient.put(`/infrastructure/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/infrastructure/${id}`);
  },
};
