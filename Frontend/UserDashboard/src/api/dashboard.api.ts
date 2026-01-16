// Dashboard API - sesuai OpenAPI spec
import { api } from './axios';
import type { DashboardOverviewResponse } from '@/types/dashboard';

export const dashboardApi = {
  /**
   * Get dashboard overview
   * GET /dashboard/overview
   */
  getOverview: () => api.get<DashboardOverviewResponse>('/dashboard/overview'),
};
