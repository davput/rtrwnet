// Payment Types - sesuai OpenAPI spec

export type PaymentMethod = 'transfer' | 'cash' | 'e-wallet';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface PaymentSummary {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_code: string;
  amount: number;
  payment_date: string | null;
  due_date: string;
  status: PaymentStatus;
  payment_method: string;
  days_overdue?: number;
}

export interface RecordPaymentRequest {
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface PaymentFilters {
  page?: number;
  per_page?: number;
  status?: PaymentStatus;
  customer_id?: string;
  month?: number;
  year?: number;
  sort_by?: 'due_date' | 'payment_date' | 'amount';
  sort_order?: 'asc' | 'desc';
}

export interface PaymentListResponse {
  success: boolean;
  message: string;
  data: {
    payments: PaymentSummary[];
    total: number;
    page: number;
    per_page: number;
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data?: any;
}
