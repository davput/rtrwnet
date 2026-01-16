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
