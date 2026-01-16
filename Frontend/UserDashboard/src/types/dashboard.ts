// Dashboard Types - sesuai OpenAPI spec

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

export interface RevenueInfo {
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

export interface Alert {
  type: string;
  message: string;
  count?: number;
  severity: 'info' | 'warning' | 'error';
  date: string;
}

export interface RecentActivities {
  recent_payments: RecentPayment[];
  recent_customers: RecentCustomer[];
  alerts: Alert[];
}

export interface ChartData {
  label: string;
  value: number;
}

export interface DashboardCharts {
  revenue_chart: ChartData[];
  customer_chart: ChartData[];
  payment_status: ChartData;
}

export interface DashboardOverview {
  statistics: DashboardStatistics;
  revenue: RevenueInfo;
  recent: RecentActivities;
  charts: DashboardCharts;
}

export interface DashboardOverviewResponse {
  success: boolean;
  message: string;
  data: DashboardOverview;
}
