import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as adminApi from "@/api/admin.api";
import type { TenantFilters, CreateTenantRequest, UpdateTenantRequest, CreatePlanRequest } from "@/types";

// Dashboard hooks
export function useDashboardStats() {
  return useQuery({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: () => adminApi.getDashboardStats(),
    select: (res) => res.data,
  });
}

export function useRevenueData(months: number = 12) {
  return useQuery({
    queryKey: ["admin", "dashboard", "revenue", months],
    queryFn: () => adminApi.getRevenueData(months),
    select: (res) => res.data,
  });
}

export function useTenantGrowthData(months: number = 12) {
  return useQuery({
    queryKey: ["admin", "dashboard", "growth", months],
    queryFn: () => adminApi.getTenantGrowthData(months),
    select: (res) => res.data,
  });
}

// Tenant hooks
export function useTenants(filters: TenantFilters) {
  return useQuery({
    queryKey: ["admin", "tenants", filters],
    queryFn: () => adminApi.getTenants(filters),
    select: (res) => res.data,
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["admin", "tenants", id],
    queryFn: () => adminApi.getTenant(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTenantRequest) => adminApi.createTenant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) => adminApi.updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.suspendTenant(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
    },
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tenants"] });
    },
  });
}

// Plan hooks
export function usePlans() {
  return useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => adminApi.getPlans(),
    select: (res) => res.data,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlanRequest) => adminApi.createPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePlanRequest> }) => adminApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
    },
  });
}

// Admin users hooks
export function useAdmins(params: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["admin", "admins", params],
    queryFn: () => adminApi.getAdmins(params),
    select: (res) => res.data,
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string; is_active: boolean }) => 
      adminApi.createAdmin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; email: string; password: string; role: string; is_active: boolean }> }) => 
      adminApi.updateAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "admins"] });
    },
  });
}

// Audit logs
export function useAuditLogs(params: { page?: number; per_page?: number; admin_id?: string }) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: () => adminApi.getAuditLogs(params),
    select: (res) => res.data,
  });
}

// Support tickets
export function useSupportTickets(params: { page?: number; per_page?: number; status?: string }) {
  return useQuery({
    queryKey: ["admin", "support-tickets", params],
    queryFn: () => adminApi.getSupportTickets(params),
    select: (res) => res.data,
  });
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: ["admin", "support-tickets", id],
    queryFn: () => adminApi.getSupportTicket(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, assignedTo }: { id: string; status: string; assignedTo?: string }) =>
      adminApi.updateTicketStatus(id, status, assignedTo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
    },
  });
}

export function useAddTicketReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      adminApi.addTicketReply(id, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
    },
  });
}

export function useResolveTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.resolveTicket(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.closeTicket(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "support-tickets"] });
    },
  });
}
