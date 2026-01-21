// Customers API - sesuai OpenAPI spec
import { api } from './axios';
import type {
  CustomerFilters,
  CustomerListResponse,
  CustomerDetailResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/types/customer';
import type { ApiResponse } from '@/types/api';

export const customersApi = {
  /**
   * Get customers list with filters
   * GET /customers
   */
  getCustomers: (filters?: CustomerFilters) =>
    api.get<CustomerListResponse>('/customers', filters),

  /**
   * Get customer detail by ID
   * GET /customers/:id
   */
  getCustomerById: (id: string) =>
    api.get<CustomerDetailResponse>(`/customers/${id}`),

  /**
   * Create a new customer
   * POST /customers
   */
  createCustomer: (data: CreateCustomerRequest) =>
    api.post<CustomerDetailResponse>('/customers', data),

  /**
   * Update a customer
   * PUT /customers/:id
   */
  updateCustomer: (id: string, data: UpdateCustomerRequest) =>
    api.put<CustomerDetailResponse>(`/customers/${id}`, data),

  /**
   * Delete a customer
   * DELETE /customers/:id
   */
  deleteCustomer: (id: string) =>
    api.delete<ApiResponse>(`/customers/${id}`),
};


// Customer Hotspot API
export const customerHotspotApi = {
  enableHotspot: async (customerId: string) => {
    const response = await apiClient.post(`/customers/${customerId}/hotspot/enable`);
    return response.data.data;
  },

  disableHotspot: async (customerId: string) => {
    const response = await apiClient.post(`/customers/${customerId}/hotspot/disable`);
    return response.data.data;
  },

  regeneratePassword: async (customerId: string) => {
    const response = await apiClient.post(`/customers/${customerId}/hotspot/regenerate-password`);
    return response.data.data;
  },

  getCredentials: async (customerId: string) => {
    const response = await apiClient.get(`/customers/${customerId}/hotspot/credentials`);
    return response.data.data;
  },
};
