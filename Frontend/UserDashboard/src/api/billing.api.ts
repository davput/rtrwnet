// Billing API - Synced with Backend OpenAPI spec
import { api } from './axios';
import type {
  BillingDashboard,
  BillingDashboardResponse,
  UpdateSubscriptionRequest,
} from '@/types/billing';
import type { ApiSuccessResponse } from '@/types/api';

export interface PlanResourceLimits {
  max_customers: number;
  max_users: number;
  max_devices: number;
  max_bandwidth: number;
  max_storage: number;
  max_hotspots: number;
  max_vlans: number;
  max_firewall_rules: number;
  max_queue_rules: number;
  max_monitoring_days: number;
  max_reports: number;
  max_alerts: number;
  max_api_calls_per_hour: number;
  max_webhooks: number;
}

export interface PlanFeatures {
  customer_management: boolean;
  billing_management: boolean;
  device_management: boolean;
  network_monitoring: boolean;
  user_management: boolean;
  mikrotik_integration: boolean;
  hotspot_management: boolean;
  vlan_management: boolean;
  firewall_management: boolean;
  queue_management: boolean;
  speed_boost: boolean;
  real_time_monitoring: boolean;
  advanced_reports: boolean;
  custom_dashboard: boolean;
  data_export: boolean;
  alert_system: boolean;
  api_access: boolean;
  webhook_support: boolean;
  third_party_integration: boolean;
  custom_branding: boolean;
  white_label: boolean;
  priority_support: boolean;
  phone_support: boolean;
  dedicated_manager: boolean;
  custom_training: boolean;
}

export interface PlanUsage {
  current_customers: number;
  current_users: number;
  current_devices: number;
  current_hotspots: number;
  current_vlans: number;
  current_alerts: number;
  current_webhooks: number;
}

export interface TrialConfig {
  trial_days: number;
  trial_enabled: boolean;
  require_payment: boolean;
  auto_convert: boolean;
}

export interface PlanLimits {
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  is_trial: boolean;
  trial_ends_at?: string;
  limits: PlanResourceLimits;
  features: PlanFeatures;
  usage: PlanUsage;
  trial_config: TrialConfig;
}

export interface UpdateSubscriptionResponse {
  success: boolean;
  message: string;
  order_id?: string;
  requires_payment?: boolean;
  action_type?: 'upgrade' | 'downgrade' | 'settings';
  new_plan_name?: string;
  new_plan_price?: number;
}

export const billingApi = {
  /**
   * GET /billing
   * Get complete billing dashboard including subscription, usage, and invoices
   */
  async getDashboard(): Promise<BillingDashboard> {
    const response = await api.get<BillingDashboardResponse>('/billing');
    return response.data;
  },

  /**
   * GET /plan-limits
   * Get current plan limits and usage
   */
  async getPlanLimits(): Promise<PlanLimits> {
    const response = await api.get<{ success: boolean; message?: string; data: PlanLimits }>('/plan-limits');
    
    // Backend returns { success: true, data: {...} }
    // Axios already parsed response.data, so we access response.data.data
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // Fallback: maybe response.data is already the PlanLimits object
    if (response.data && 'plan_id' in response.data) {
      return response.data as any;
    }
    
    throw new Error('Invalid response format from /plan-limits');
  },

  /**
   * PUT /billing/subscription
   * Update subscription plan or settings
   * Returns order_id if upgrade requires payment
   */
  async updateSubscription(data: UpdateSubscriptionRequest): Promise<UpdateSubscriptionResponse> {
    const response = await api.put<{ success: boolean; message: string; data: UpdateSubscriptionResponse }>('/billing/subscription', data);
    // api.put returns the full response body, so we access .data directly
    return response.data;
  },

  /**
   * POST /billing/cancel
   * Cancel current subscription
   */
  async cancelSubscription(reason?: string): Promise<void> {
    await api.post<ApiSuccessResponse>('/billing/cancel', { reason });
  },
};
