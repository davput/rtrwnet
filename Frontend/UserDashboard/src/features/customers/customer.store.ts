// Customer Store - State management
import { useState, useEffect, useCallback } from 'react';
import { customerApi } from './customer.api';
import type { Customer, CustomerFilters, CustomerStats } from './customer.types';

// Adapter to convert API response to Customer type
function apiToCustomer(apiCustomer: any): Customer {
  return {
    id: apiCustomer.id,
    customer_code: apiCustomer.customer_code,
    name: apiCustomer.name,
    email: apiCustomer.email || '',
    phone: apiCustomer.phone,
    address: apiCustomer.address || '',
    latitude: apiCustomer.latitude,
    longitude: apiCustomer.longitude,
    service_plan_id: apiCustomer.service_plan_id || '',
    service_plan: apiCustomer.service_plan ? {
      id: apiCustomer.service_plan.id,
      name: apiCustomer.service_plan.name,
      speed_download: apiCustomer.service_plan.speed_download,
      speed_upload: apiCustomer.service_plan.speed_upload,
      price: apiCustomer.service_plan.price,
      is_active: apiCustomer.service_plan.is_active,
    } : undefined,
    service_type: apiCustomer.service_type || 'dhcp',
    pppoe_username: apiCustomer.pppoe_username,
    pppoe_password: apiCustomer.pppoe_password,
    static_ip: apiCustomer.static_ip,
    static_gateway: apiCustomer.static_gateway,
    static_dns: apiCustomer.static_dns,
    is_online: apiCustomer.is_online || false,
    ip_address: apiCustomer.ip_address,
    last_seen: apiCustomer.last_seen,
    monthly_fee: apiCustomer.monthly_fee,
    status: apiCustomer.status,
    due_date: apiCustomer.due_date,
    installation_date: apiCustomer.installation_date,
    notes: apiCustomer.notes,
    created_at: apiCustomer.created_at,
    updated_at: apiCustomer.updated_at,
  };
}

// Hook: useCustomers
export function useCustomers(filters?: CustomerFilters) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setCustomers([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const response = await customerApi.getCustomers({
        page: filters?.page || 1,
        per_page: filters?.per_page || 100,
        search: filters?.search,
        status: filters?.status,
        service_type: filters?.service_type,
        service_plan_id: filters?.service_plan_id,
      });
      
      const appCustomers = response.customers.map(apiToCustomer);
      setCustomers(appCustomers);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.status, filters?.search, filters?.service_type, filters?.service_plan_id, filters?.page, filters?.per_page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const refresh = useCallback(() => {
    loadCustomers();
  }, [loadCustomers]);

  return { customers, total, loading, error, refresh };
}

// Hook: useCustomer (single)
export function useCustomer(id: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    const loadCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          setCustomer(null);
          setLoading(false);
          return;
        }

        const data = await customerApi.getCustomerById(id);
        setCustomer(apiToCustomer(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await customerApi.getCustomerById(id);
      setCustomer(apiToCustomer(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh customer');
    } finally {
      setLoading(false);
    }
  };

  return { customer, loading, error, refresh };
}

// Hook: useCustomerStats
export function useCustomerStats() {
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    pending: 0,
    online: 0,
    offline: 0,
    totalOutstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get stats from dashboard overview
      const { dashboardApi } = await import('@/features/dashboard/dashboard.api');
      const overview = await dashboardApi.getOverview();
      
      setStats({
        total: overview.statistics.total_customers,
        active: overview.statistics.active_customers,
        inactive: 0,
        suspended: overview.statistics.suspended_customers,
        pending: overview.statistics.pending_payments,
        online: 0,
        offline: 0,
        totalOutstanding: overview.revenue.pending + overview.revenue.overdue,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refresh = useCallback(() => {
    loadStats();
  }, [loadStats]);

  return { stats, loading, error, refresh };
}
