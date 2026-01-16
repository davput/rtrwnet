// Payments Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments.api';
import type { PaymentFilters, RecordPaymentRequest } from '@/types/payment';

export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
};

/**
 * Hook to fetch payments list with filters
 */
export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: () => paymentsApi.getPayments(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to record a new payment
 */
export function useRecordPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RecordPaymentRequest) => paymentsApi.recordPayment(data),
    onSuccess: () => {
      // Invalidate payments list to refetch
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      // Also invalidate dashboard to update statistics
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
