import api from "./axios";
import type {
  ApiResponse,
  Tenant,
  TenantFilters,
  TenantListResponse,
  CreateTenantRequest,
  UpdateTenantRequest,
  SubscriptionPlan,
  CreatePlanRequest,
  AdminDashboardStats,
  RevenueData,
  TenantGrowthData,
  AuditLog,
  SupportTicket,
  AdminUser,
  PaymentTransaction,
  ReconcileResponse,
  PlanLimits,
  PlanFeatures,
  TrialConfig,
} from "@/types";

// Dashboard Stats
export const getDashboardStats = () => 
  api.get<ApiResponse<AdminDashboardStats>>("/admin/dashboard/stats");

export const getRevenueData = (months: number = 12) =>
  api.get<ApiResponse<RevenueData[]>>(`/admin/dashboard/revenue?months=${months}`);

export const getTenantGrowthData = (months: number = 12) =>
  api.get<ApiResponse<TenantGrowthData[]>>(`/admin/dashboard/growth?months=${months}`);

// Tenants
export const getTenants = (filters: TenantFilters) =>
  api.get<ApiResponse<TenantListResponse>>("/admin/tenants", { params: filters });

export const getTenant = (id: string) => 
  api.get<ApiResponse<Tenant>>(`/admin/tenants/${id}`);

export const createTenant = (data: CreateTenantRequest) =>
  api.post<ApiResponse<Tenant>>("/admin/tenants", data);

export const updateTenant = (id: string, data: UpdateTenantRequest) =>
  api.put<ApiResponse<Tenant>>(`/admin/tenants/${id}`, data);

export const deleteTenant = (id: string) => 
  api.delete<ApiResponse<void>>(`/admin/tenants/${id}`);

export const suspendTenant = (id: string, reason: string) =>
  api.post<ApiResponse<Tenant>>(`/admin/tenants/${id}/suspend`, { reason });

export const activateTenant = (id: string) =>
  api.post<ApiResponse<Tenant>>(`/admin/tenants/${id}/activate`);

// Subscription Plans
export const getPlans = () => 
  api.get<ApiResponse<SubscriptionPlan[]>>("/admin/plans");

export const getPlan = (id: string) => 
  api.get<ApiResponse<SubscriptionPlan>>(`/admin/plans/${id}`);

export const createPlan = (data: CreatePlanRequest) =>
  api.post<ApiResponse<SubscriptionPlan>>("/admin/plans", data);

export const updatePlan = (id: string, data: Partial<CreatePlanRequest> & { is_active?: boolean }) =>
  api.put<ApiResponse<SubscriptionPlan>>(`/admin/plans/${id}`, data);

export const deletePlan = (id: string) => 
  api.delete<ApiResponse<void>>(`/admin/plans/${id}`);

// Admin Users
export const getAdmins = (params: { page?: number; per_page?: number }) =>
  api.get<ApiResponse<{ admins: AdminUser[]; total: number }>>("/admin/admins", { params });

export const createAdmin = (data: { name: string; email: string; password: string; role: string; is_active: boolean }) =>
  api.post<ApiResponse<AdminUser>>("/admin/admins", data);

export const updateAdmin = (id: string, data: Partial<{ name: string; email: string; password: string; role: string; is_active: boolean }>) =>
  api.put<ApiResponse<AdminUser>>(`/admin/admins/${id}`, data);

export const deleteAdmin = (id: string) => 
  api.delete<ApiResponse<void>>(`/admin/admins/${id}`);

// Audit Logs
export const getAuditLogs = (params: { page?: number; per_page?: number; admin_id?: string }) =>
  api.get<ApiResponse<{ logs: AuditLog[]; total: number }>>("/admin/audit-logs", { params });

// Support Tickets
export const getSupportTickets = (params: { page?: number; per_page?: number; status?: string }) =>
  api.get<ApiResponse<{ tickets: SupportTicket[]; total: number }>>("/admin/support-tickets", { params });

export const getSupportTicket = (id: string) =>
  api.get<ApiResponse<SupportTicket>>(`/admin/support-tickets/${id}`);

export const updateTicketStatus = (id: string, status: string, assignedTo?: string) =>
  api.put<ApiResponse<SupportTicket>>(`/admin/support-tickets/${id}`, { status, assigned_to: assignedTo });

export const addTicketReply = (id: string, message: string) =>
  api.post<ApiResponse<{ id: string; message: string; is_admin: boolean; created_at: string }>>(`/admin/support-tickets/${id}/reply`, { message });

export const resolveTicket = (id: string) =>
  api.post<ApiResponse<void>>(`/admin/support-tickets/${id}/resolve`);

export const closeTicket = (id: string) =>
  api.post<ApiResponse<void>>(`/admin/support-tickets/${id}/close`);

// Auth
export const adminLogin = (email: string, password: string) =>
  api.post<ApiResponse<{ token: string; refresh_token?: string; user: AdminUser }>>(
    "/admin/auth/login",
    { email, password }
  );

export const adminLogout = () => 
  api.post<ApiResponse<void>>("/admin/auth/logout");

export const getAdminProfile = () =>
  api.get<ApiResponse<AdminUser>>("/admin/auth/profile");

export const refreshAdminToken = (refreshToken: string) =>
  api.post<ApiResponse<{ access_token: string; refresh_token?: string }>>(
    "/admin/auth/refresh",
    { refresh_token: refreshToken }
  );

// Payment Transactions
export const getPaymentTransactions = (params: {
  page?: number;
  per_page?: number;
  status?: string;
  tenant_id?: string;
  search?: string;
}) =>
  api.get<ApiResponse<{ transactions: PaymentTransaction[]; total: number; page: number; per_page: number }>>(
    "/admin/payments",
    { params }
  );

export const getPaymentStats = () =>
  api.get<ApiResponse<{
    total_transactions: number;
    total_revenue: number;
    pending_count: number;
    paid_count: number;
    failed_count: number;
    expired_count: number;
  }>>("/admin/payments/stats");

export const getPaymentTransaction = (id: string) =>
  api.get<ApiResponse<PaymentTransaction>>(`/admin/payments/${id}`);

export const reconcilePayment = (orderID: string) =>
  api.post<ApiResponse<ReconcileResponse>>(`/admin/payments/${orderID}/reconcile`);
