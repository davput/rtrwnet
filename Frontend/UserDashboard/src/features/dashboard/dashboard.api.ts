// Dashboard API
import type { DashboardOverview, DashboardStatistics, DashboardRevenue } from './dashboard.types';

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

export const dashboardApi = {
  async getOverview(): Promise<DashboardOverview> {
    const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard overview');
    }

    const result = await response.json();
    return result.data;
  },

  async getStatistics(): Promise<DashboardStatistics> {
    const overview = await this.getOverview();
    return overview.statistics;
  },

  async getRevenue(): Promise<DashboardRevenue> {
    const overview = await this.getOverview();
    return overview.revenue;
  },
};
