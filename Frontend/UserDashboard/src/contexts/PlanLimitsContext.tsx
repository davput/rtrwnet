import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { billingApi, PlanLimits, PlanFeatures } from '@/api/billing.api';

interface PlanLimitsContextType {
  limits: PlanLimits | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canAddCustomer: () => boolean;
  canAddUser: () => boolean;
  canAddDevice: () => boolean;
  canAddHotspot: () => boolean;
  hasFeature: (featureName: keyof PlanFeatures) => boolean;
  getResourceUsagePercent: (resource: 'customers' | 'users' | 'devices' | 'hotspots') => number;
  isTrialActive: () => boolean;
  getTrialDaysRemaining: () => number;
}

const PlanLimitsContext = createContext<PlanLimitsContextType | undefined>(undefined);

export function PlanLimitsProvider({ children }: { children: ReactNode }) {
  const [limits, setLimits] = useState<PlanLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await billingApi.getPlanLimits();
      setLimits(data);
    } catch (err: any) {
      console.error('Failed to fetch plan limits:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load plan limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const canAddCustomer = (): boolean => {
    if (!limits) return false;
    if (limits.limits.max_customers === -1) return true;
    return limits.usage.current_customers < limits.limits.max_customers;
  };

  const canAddUser = (): boolean => {
    if (!limits) return false;
    if (limits.limits.max_users === -1) return true;
    return limits.usage.current_users < limits.limits.max_users;
  };

  const canAddDevice = (): boolean => {
    if (!limits) return false;
    if (limits.limits.max_devices === -1) return true;
    return limits.usage.current_devices < limits.limits.max_devices;
  };

  const canAddHotspot = (): boolean => {
    if (!limits) return false;
    if (limits.limits.max_hotspots === -1) return true;
    return limits.usage.current_hotspots < limits.limits.max_hotspots;
  };

  const hasFeature = (featureName: keyof PlanFeatures): boolean => {
    if (!limits || !limits.features) return false;
    return limits.features[featureName] === true;
  };

  const getResourceUsagePercent = (resource: 'customers' | 'users' | 'devices' | 'hotspots'): number => {
    if (!limits) return 0;
    
    const usageMap = {
      customers: { current: limits.usage.current_customers, max: limits.limits.max_customers },
      users: { current: limits.usage.current_users, max: limits.limits.max_users },
      devices: { current: limits.usage.current_devices, max: limits.limits.max_devices },
      hotspots: { current: limits.usage.current_hotspots, max: limits.limits.max_hotspots },
    };
    
    const { current, max } = usageMap[resource];
    if (max === -1) return 0; // Unlimited
    if (max === 0) return 100;
    return Math.round((current / max) * 100);
  };

  const isTrialActive = (): boolean => {
    return limits?.is_trial === true;
  };

  const getTrialDaysRemaining = (): number => {
    if (!limits?.trial_ends_at) return 0;
    const endDate = new Date(limits.trial_ends_at);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <PlanLimitsContext.Provider
      value={{
        limits,
        loading,
        error,
        refresh: fetchLimits,
        canAddCustomer,
        canAddUser,
        canAddDevice,
        canAddHotspot,
        hasFeature,
        getResourceUsagePercent,
        isTrialActive,
        getTrialDaysRemaining,
      }}
    >
      {children}
    </PlanLimitsContext.Provider>
  );
}

export function usePlanLimits() {
  const context = useContext(PlanLimitsContext);
  if (context === undefined) {
    throw new Error('usePlanLimits must be used within a PlanLimitsProvider');
  }
  return context;
}
