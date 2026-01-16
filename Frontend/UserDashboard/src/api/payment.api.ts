import { api } from './axios';

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  bank?: string;
  description: string;
  icon: string;
}

export interface InvoiceDetails {
  order_id: string;
  amount: number;
  status: string;
  tenant_name: string;
  tenant_email: string;
  created_at: string;
  has_payment?: boolean;
  payment_info?: {
    payment_type?: string;
    transaction_id?: string;
    va_numbers?: Array<{ bank: string; va_number: string }>;
    permata_va_number?: string;
    biller_code?: string;
    bill_key?: string;
    qr_code_url?: string;
    deeplink_url?: string;
    qr_string?: string;
    expiry_time?: string;
  };
}

export interface PaymentTokenResponse {
  order_id: string;
  transaction_id: string;
  status: string;
  amount: number;
  payment_type: string;
  qr_code_url?: string;
  deeplink_url?: string;
  va_numbers?: Array<{
    bank: string;
    va_number: string;
  }>;
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  actions?: Array<{
    name: string;
    method: string;
    url: string;
  }>;
}

export interface PaymentStatusResponse {
  order_id: string;
  transaction_id: string;
  status: string;
  amount: number;
  payment_type: string;
  transaction_time: string;
  fraud_status: string;
}

export const paymentApi = {
  /**
   * GET /payment/methods
   * Get available payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await api.get<{ success: boolean; data: PaymentMethod[] }>(
      '/payment/methods'
    );
    return response.data;
  },

  /**
   * GET /payment/:order_id/details
   * Get invoice details
   */
  async getInvoiceDetails(orderID: string): Promise<InvoiceDetails> {
    const response = await api.get<{ success: boolean; data: InvoiceDetails }>(
      `/payment/${orderID}/details`
    );
    return response.data;
  },

  /**
   * POST /payment/:order_id/token
   * Create payment token for invoice with selected payment method
   */
  async createPaymentToken(orderID: string, paymentMethod: string): Promise<PaymentTokenResponse> {
    const response = await api.post<{ success: boolean; data: PaymentTokenResponse }>(
      `/payment/${orderID}/token`,
      { payment_method: paymentMethod }
    );
    return response.data;
  },

  /**
   * GET /payment/:order_id/status
   * Get payment status
   */
  async getPaymentStatus(orderID: string): Promise<PaymentStatusResponse> {
    const response = await api.get<{ success: boolean; data: PaymentStatusResponse }>(
      `/payment/${orderID}/status`
    );
    return response.data;
  },
};
