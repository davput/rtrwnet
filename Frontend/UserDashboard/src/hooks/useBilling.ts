// Billing Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingApi } from '@/api/billing.api';
import { publicApi } from '@/api/public.api';
import type { UpdateSubscriptionRequest } from '@/types/billing';

// Query keys
export const billingKeys = {
  all: ['billing'] as const,
  dashboard: () => [...billingKeys.all, 'dashboard'] as const,
  plans: () => ['plans'] as const,
};

/**
 * Hook to fetch billing dashboard data
 */
export function useBillingDashboard() {
  return useQuery({
    queryKey: billingKeys.dashboard(),
    queryFn: () => billingApi.getDashboard(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch available subscription plans
 */
export function useSubscriptionPlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: () => publicApi.getPlans(),
    staleTime: 1000 * 60 * 30, // 30 minutes (plans don't change often)
  });
}

/**
 * Hook to update subscription
 */
export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateSubscriptionRequest) => billingApi.updateSubscription(data),
    onSuccess: async () => {
      // Invalidate and refetch billing dashboard
      await queryClient.invalidateQueries({ queryKey: billingKeys.dashboard() });
      // Invalidate plan limits to update usage info
      await queryClient.invalidateQueries({ queryKey: ['plan-limits'] });
      // Force refetch immediately
      await queryClient.refetchQueries({ queryKey: billingKeys.dashboard() });
      console.log('Billing data refreshed after subscription update');
    },
  });
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reason?: string) => billingApi.cancelSubscription(reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: billingKeys.dashboard() });
    },
  });
}
