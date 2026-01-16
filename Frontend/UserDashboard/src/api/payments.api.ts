// Payments API - sesuai OpenAPI spec
import { api } from './axios';
import type {
  PaymentFilters,
  PaymentListResponse,
  PaymentResponse,
  RecordPaymentRequest,
} from '@/types/payment';

export const paymentsApi = {
  /**
   * Get payments list with filters
   * GET /payments
   */
  getPayments: (filters?: PaymentFilters) =>
    api.get<PaymentListResponse>('/payments', filters),

  /**
   * Record a new payment
   * POST /payments
   */
  recordPayment: (data: RecordPaymentRequest) =>
    api.post<PaymentResponse>('/payments', data),
};
