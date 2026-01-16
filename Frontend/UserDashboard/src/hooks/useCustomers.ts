// Customers Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/api/customers.api';
import type {
  CustomerFilters,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/types/customer';

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

/**
 * Hook to fetch customers list with filters
 */
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customersApi.getCustomers(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch customer detail by ID
 */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getCustomerById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => customersApi.createCustomer(data),
    onSuccess: () => {
      // Invalidate customers list to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      // Also invalidate dashboard to update statistics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customersApi.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer(id),
    onSuccess: () => {
      // Invalidate customers list to refetch
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      // Also invalidate dashboard to update statistics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
