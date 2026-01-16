// Payment Store - State management
import { useState, useEffect, useCallback } from 'react';
import { paymentApi } from './payment.api';
import type { Payment, PaymentFilters } from './payment.types';

// Hook: usePayments
export function usePayments(filters?: PaymentFilters) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setPayments([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const response = await paymentApi.getAll(filters);
      setPayments(response.payments || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.page, filters?.per_page, filters?.status, filters?.customer_id, filters?.month, filters?.year]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const refresh = useCallback(() => {
    loadPayments();
  }, [loadPayments]);

  return { payments, total, loading, error, refresh };
}

// Hook: usePayment (single)
export function usePayment(id: string | undefined) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPayment(null);
      setLoading(false);
      return;
    }

    const loadPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          setPayment(null);
          setLoading(false);
          return;
        }

        const data = await paymentApi.getById(id);
        setPayment(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load payment');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await paymentApi.getById(id);
      setPayment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh payment');
    } finally {
      setLoading(false);
    }
  };

  return { payment, loading, error, refresh };
}
