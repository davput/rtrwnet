// Payment Types
export interface Payment {
  id: string;
  customer_id: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface CreatePaymentRequest {
  customer_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes?: string;
}

export interface PaymentFilters {
  page?: number;
  per_page?: number;
  customer_id?: string;
  status?: 'pending' | 'paid' | 'overdue';
  month?: number;
  year?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaymentsResponse {
  payments: Payment[];
  total: number;
  page: number;
  per_page: number;
}
