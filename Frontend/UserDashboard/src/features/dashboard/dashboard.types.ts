// Dashboard Types
export interface DashboardStatistics {
  total_customers: number;
  active_customers: number;
  suspended_customers: number;
  new_customers_month: number;
  total_revenue: number;
  monthly_revenue: number;
  pending_payments: number;
  overdue_payments: number;
}

export interface DashboardRevenue {
  this_month: number;
  last_month: number;
  growth: number;
  collected: number;
  pending: number;
  overdue: number;
  collection_rate: number;
}

export interface RecentPayment {
  id: string;
  customer_name: string;
  customer_code: string;
  amount: number;
  payment_date: string;
  payment_method: string;
}

export interface RecentCustomer {
  id: string;
  name: string;
  customer_code: string;
  service_plan: string;
  installation_date: string;
  status: string;
}

export interface DashboardAlert {
  type: string;
  message: string;
  count: number;
  severity: string;
  date: string;
}

export interface DashboardOverview {
  statistics: DashboardStatistics;
  revenue: DashboardRevenue;
  recent: {
    recent_payments: RecentPayment[];
    recent_customers: RecentCustomer[];
    alerts: DashboardAlert[];
  };
  charts: {
    revenue_chart: any[];
    customer_chart: any[];
    payment_status: any;
  };
}
