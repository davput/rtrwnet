// Public API - Synced with Backend OpenAPI spec
// These endpoints don't require authentication

import type { SubscriptionPlan, PlansResponse } from '@/types/billing';
import type { HealthResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8089/api/v1';

export const publicApi = {
  /**
   * GET /health
   * Check if the API is running
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('API health check failed');
    }
    return response.json();
  },

  /**
   * GET /public/plans
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const response = await fetch(`${API_BASE_URL}/public/plans`);
    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }
    const result: PlansResponse = await response.json();
    return result.data.plans;
  },
};
