// Service Plans API - sesuai OpenAPI spec
import { api } from './axios';
import type {
  ServicePlanListResponse,
  ServicePlanResponse,
  CreateServicePlanRequest,
  UpdateServicePlanRequest,
} from '@/types/servicePlan';
import type { ApiResponse } from '@/types/api';

export const servicePlansApi = {
  /**
   * Get service plans list
   * GET /service-plans
   */
  getServicePlans: () =>
    api.get<ServicePlanListResponse>('/service-plans'),

  /**
   * Create a new service plan
   * POST /service-plans
   */
  createServicePlan: (data: CreateServicePlanRequest) =>
    api.post<ServicePlanResponse>('/service-plans', data),

  /**
   * Update a service plan
   * PUT /service-plans/:id
   */
  updateServicePlan: (id: string, data: UpdateServicePlanRequest) =>
    api.put<ServicePlanResponse>(`/service-plans/${id}`, data),

  /**
   * Delete a service plan
   * DELETE /service-plans/:id
   */
  deleteServicePlan: (id: string) =>
    api.delete<ApiResponse>(`/service-plans/${id}`),
};
