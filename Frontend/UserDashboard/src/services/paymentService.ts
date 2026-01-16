// Payment Service - Mock Implementation
import type { Payment } from '@/types';
import { mockPayments } from './mockData';

class PaymentService {
  private payments: Payment[] = [...mockPayments];

  // Get payments by customer ID
  getPaymentsByCustomer(customerId: string): Payment[] {
    return this.payments
      .filter(p => p.customerId === customerId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  // Get recent payments (last N payments)
  getRecentPayments(customerId: string, limit: number = 6): Payment[] {
    return this.getPaymentsByCustomer(customerId).slice(0, limit);
  }

  // Record new payment
  recordPayment(data: Omit<Payment, 'id' | 'createdAt' | 'receiptNumber'>): Payment {
    const newPayment: Payment = {
      ...data,
      id: `pay-${Date.now()}`,
      receiptNumber: this.generateReceiptNumber(),
      createdAt: new Date().toISOString(),
    };

    this.payments.push(newPayment);
    return newPayment;
  }

  // Generate receipt number
  private generateReceiptNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const count = this.payments.filter(p => p.receiptNumber.includes(dateStr)).length + 1;
    return `PAY-${dateStr}-${String(count).padStart(4, '0')}`;
  }

  // Calculate total paid
  getTotalPaid(customerId: string): number {
    return this.payments
      .filter(p => p.customerId === customerId)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  // Get payment by ID
  getPayment(id: string): Payment | undefined {
    return this.payments.find(p => p.id === id);
  }
}

export const paymentService = new PaymentService();
