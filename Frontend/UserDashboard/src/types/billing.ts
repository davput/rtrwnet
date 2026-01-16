// Billing Types - Synced with Backend OpenAPI spec

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: string;
  max_customers: number;
  max_users: number;
  features: Record<string, boolean | string | number>;
}

export interface TenantBillingInfo {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

export interface SubscriptionBillingInfo {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_slug: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'pending';
  is_trial: boolean;
  start_date: string;
  end_date: string;
  next_billing_date: string | null;
  days_left: number;
  auto_renew: boolean;
  payment_method: string;
}

export interface PlanOption {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  is_current: boolean;
}

export interface BillingDetails {
  current_plan: string;
  monthly_price: number;
  currency: string;
  next_billing: string;
  payment_method: string;
  can_upgrade: boolean;
  can_downgrade: boolean;
  available_plans: PlanOption[];
}

export interface UsageInfo {
  current_period_start: string;
  current_period_end: string;
  days_used: number;
  days_remaining: number;
}

export interface InvoiceInfo {
  id: string;
  invoice_no: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  issued_date: string;
  due_date: string;
  paid_date: string | null;
  download_url: string | null;
}

export interface BillingDashboard {
  tenant: TenantBillingInfo;
  subscription: SubscriptionBillingInfo;
  billing: BillingDetails;
  usage: UsageInfo;
  invoices: InvoiceInfo[];
}

export interface UpdateSubscriptionRequest {
  plan_id: string;
  payment_method?: string;
  auto_renew?: boolean;
}

// API Response types
export interface PlansResponse {
  success: boolean;
  message: string;
  data: {
    plans: SubscriptionPlan[];
    total: number;
  };
}

export interface BillingDashboardResponse {
  success: boolean;
  message: string;
  data: BillingDashboard;
}
