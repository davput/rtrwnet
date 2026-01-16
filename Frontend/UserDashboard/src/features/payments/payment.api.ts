// Payment API
import type { Payment, CreatePaymentRequest, PaymentFilters, PaymentsResponse } from './payment.types';

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

export const paymentApi = {
  async getAll(params?: PaymentFilters): Promise<PaymentsResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/payments?${queryParams}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }

    const result = await response.json();
    return result.data;
  },

  async getById(id: string): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }

    const result = await response.json();
    return result.data;
  },

  async create(data: CreatePaymentRequest): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create payment');
    }

    return result.data;
  },

  async updateStatus(id: string, status: string): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update payment status');
    }

    return result.data;
  },
};
