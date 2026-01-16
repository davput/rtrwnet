// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Tenant types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  logo_url?: string;
  status: TenantStatus;
  plan_id: string;
  plan_name: string;
  customer_count: number;
  monthly_revenue: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export type TenantStatus = "active" | "suspended" | "trial" | "expired";

export interface TenantFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: TenantStatus;
  plan_id?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface TenantListResponse {
  tenants: Tenant[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  plan_id: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateTenantRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: TenantStatus;
  plan_id?: string;
}

// Plan Limits - Resource limits for subscription plans
export interface PlanLimits {
  max_customers: number;      // -1 for unlimited
  max_users: number;          // -1 for unlimited
  max_devices: number;        // -1 for unlimited
  max_bandwidth: number;      // in Mbps, -1 for unlimited
  max_storage: number;        // in GB, -1 for unlimited
  max_hotspots: number;       // -1 for unlimited
  max_vlans: number;          // -1 for unlimited
  max_firewall_rules: number; // -1 for unlimited
  max_queue_rules: number;    // -1 for unlimited
  max_monitoring_days: number;
  max_reports: number;
  max_alerts: number;
  max_api_calls_per_hour: number;
  max_webhooks: number;
}

// Plan Features - Feature flags for subscription plans
export interface PlanFeatures {
  // Core Features
  customer_management: boolean;
  billing_management: boolean;
  device_management: boolean;
  network_monitoring: boolean;
  user_management: boolean;
  // Advanced Features
  mikrotik_integration: boolean;
  hotspot_management: boolean;
  vlan_management: boolean;
  firewall_management: boolean;
  queue_management: boolean;
  speed_boost: boolean;
  // Monitoring & Analytics
  real_time_monitoring: boolean;
  advanced_reports: boolean;
  custom_dashboard: boolean;
  data_export: boolean;
  alert_system: boolean;
  // Integration Features
  api_access: boolean;
  webhook_support: boolean;
  third_party_integration: boolean;
  custom_branding: boolean;
  white_label: boolean;
  // Support Features
  priority_support: boolean;
  phone_support: boolean;
  dedicated_manager: boolean;
  custom_training: boolean;
}

// Trial Configuration
export interface TrialConfig {
  trial_days: number;
  trial_enabled: boolean;
  require_payment: boolean;
  auto_convert: boolean;
}

// Subscription Plan types
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  max_customers: number;
  max_users: number;
  features: string | string[] | Record<string, boolean>;
  is_active: boolean;
  is_public: boolean;
  is_trial: boolean;
  sort_order: number;
  limits: PlanLimits | string;
  plan_features: PlanFeatures | string;
  trial_config: TrialConfig | string;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanRequest {
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  max_customers: number;
  max_users: number;
  features: string[];
  is_public?: boolean;
  is_trial?: boolean;
  sort_order?: number;
  limits?: PlanLimits;
  plan_features?: PlanFeatures;
  trial_config?: TrialConfig;
}

// Default values for new plans
export const DEFAULT_PLAN_LIMITS: PlanLimits = {
  max_customers: 50,
  max_users: 2,
  max_devices: 5,
  max_bandwidth: 100,
  max_storage: 10,
  max_hotspots: 2,
  max_vlans: 5,
  max_firewall_rules: 20,
  max_queue_rules: 10,
  max_monitoring_days: 30,
  max_reports: 5,
  max_alerts: 10,
  max_api_calls_per_hour: 100,
  max_webhooks: 2,
};

export const DEFAULT_PLAN_FEATURES: PlanFeatures = {
  customer_management: true,
  billing_management: true,
  device_management: true,
  network_monitoring: true,
  user_management: true,
  mikrotik_integration: true,
  hotspot_management: false,
  vlan_management: false,
  firewall_management: false,
  queue_management: true,
  speed_boost: false,
  real_time_monitoring: false,
  advanced_reports: false,
  custom_dashboard: false,
  data_export: false,
  alert_system: true,
  api_access: false,
  webhook_support: false,
  third_party_integration: false,
  custom_branding: false,
  white_label: false,
  priority_support: false,
  phone_support: false,
  dedicated_manager: false,
  custom_training: false,
};

export const DEFAULT_TRIAL_CONFIG: TrialConfig = {
  trial_days: 14,
  trial_enabled: true,
  require_payment: false,
  auto_convert: false,
};

// Admin Dashboard Stats
export interface AdminDashboardStats {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  total_customers: number;
  monthly_revenue: number;
  growth_rate: number;
  new_tenants_this_month: number;
  churn_rate: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  tenants: number;
}

export interface TenantGrowthData {
  month: string;
  new_tenants: number;
  churned_tenants: number;
  total_tenants: number;
}

// Admin User types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "support";
  is_active: boolean;
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

// Audit Log types
export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address: string;
  created_at: string;
}

// Support Ticket types
export interface SupportTicket {
  id: string;
  tenant_id: string;
  tenant_name: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

// Payment Transaction types
export interface PaymentTransaction {
  id: string;
  tenant_id: string;
  tenant_name: string;
  subscription_id?: string;
  plan_id?: string;
  order_id: string;
  amount: number;
  status: string;
  payment_method: string;
  payment_gateway: string;
  gateway_transaction_id: string;
  paid_at?: string;
  expired_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransactionFilters {
  page?: number;
  per_page?: number;
  status?: string;
  tenant_id?: string;
  search?: string;
}

export interface PaymentTransactionListResponse {
  transactions: PaymentTransaction[];
  total: number;
  page: number;
  per_page: number;
}

export interface ReconcileResponse {
  order_id: string;
  local_status: string;
  gateway_status: string;
  is_matched: boolean;
  message: string;
  updated_status?: string;
}
