// Service Plans Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicePlansApi } from '@/api/service-plans.api';
import type { CreateServicePlanRequest, UpdateServicePlanRequest } from '@/types/servicePlan';

export const servicePlanKeys = {
  all: ['servicePlans'] as const,
  lists: () => [...servicePlanKeys.all, 'list'] as const,
  list: () => [...servicePlanKeys.lists()] as const,
  details: () => [...servicePlanKeys.all, 'detail'] as const,
  detail: (id: string) => [...servicePlanKeys.details(), id] as const,
};

/**
 * Hook to fetch service plans list
 */
export function useServicePlans() {
  return useQuery({
    queryKey: servicePlanKeys.list(),
    queryFn: () => servicePlansApi.getServicePlans(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new service plan
 */
export function useCreateServicePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServicePlanRequest) => servicePlansApi.createServicePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
    },
  });
}

/**
 * Hook to update a service plan
 */
export function useUpdateServicePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServicePlanRequest }) =>
      servicePlansApi.updateServicePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
    },
  });
}

/**
 * Hook to delete a service plan
 */
export function useDeleteServicePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => servicePlansApi.deleteServicePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicePlanKeys.lists() });
    },
  });
}
