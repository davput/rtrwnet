// Service Plan API
import type { ServicePlan, ServicePlanAdvanced, CreateServicePlanRequest, UpdateServicePlanRequest } from './service-plan.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  const tenantId = localStorage.getItem('tenant_id');
  
  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId || '',
    'Content-Type': 'application/json',
  };
};

export const servicePlanApi = {
  async getAll(): Promise<ServicePlan[]> {
    const response = await fetch(`${API_BASE_URL}/service-plans`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service plans');
    }

    const result = await response.json();
    return result.data?.plans || [];
  },

  async getById(id: string): Promise<ServicePlan> {
    const response = await fetch(`${API_BASE_URL}/service-plans/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service plan');
    }

    const result = await response.json();
    return result.data;
  },

  async create(data: CreateServicePlanRequest): Promise<ServicePlan> {
    const response = await fetch(`${API_BASE_URL}/service-plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create service plan');
    }

    return result.data;
  },

  async update(id: string, data: UpdateServicePlanRequest): Promise<ServicePlan> {
    const response = await fetch(`${API_BASE_URL}/service-plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update service plan');
    }

    return result.data;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/service-plans/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete service plan');
    }
  },

  async getAdvancedSettings(id: string): Promise<ServicePlanAdvanced> {
    const response = await fetch(`${API_BASE_URL}/service-plans/${id}/advanced`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch advanced settings');
    }

    const result = await response.json();
    return result.data;
  },

  async updateAdvancedSettings(id: string, data: Partial<ServicePlanAdvanced>): Promise<ServicePlanAdvanced> {
    const response = await fetch(`${API_BASE_URL}/service-plans/${id}/advanced`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update advanced settings');
    }

    return result.data;
  },
};
