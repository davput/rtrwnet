// Customer API
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerFilters } from './customer.types';

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

export interface CustomersResponse {
  customers: any[];
  total: number;
  page: number;
  per_page: number;
}

export const customerApi = {
  async getCustomers(params?: CustomerFilters): Promise<CustomersResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(
      `${API_BASE_URL}/customers?${queryParams}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }

    const result = await response.json();
    return result.data;
  },

  async getCustomerById(id: string): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/customers/${id}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch customer');
    }

    const result = await response.json();
    return result.data;
  },

  async createCustomer(data: CreateCustomerRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.error?.details?.error || result.message || 'Failed to create customer';
      throw new Error(errorMessage);
    }

    return result.data;
  },

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update customer');
    }
  },

  async deleteCustomer(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete customer');
    }
  },

  async activateCustomer(id: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to activate customer');
    }

    const result = await response.json();
    return result.data;
  },

  async suspendCustomer(id: string, reason?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/suspend`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to suspend customer');
    }

    const result = await response.json();
    return result.data;
  },

  async terminateCustomer(id: string, reason?: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/customers/${id}/terminate`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error('Failed to terminate customer');
    }

    const result = await response.json();
    return result.data;
  },

  // Export customers to CSV
  async exportCustomers(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/export`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to export customers');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Download import template
  async downloadTemplate(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/customers/template`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download template');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Import customers from CSV
  async importCustomers(file: File): Promise<{ imported: number; failed: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');

    const response = await fetch(`${API_BASE_URL}/customers/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-ID': tenantId || '',
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to import customers');
    }

    return result.data;
  },
};
