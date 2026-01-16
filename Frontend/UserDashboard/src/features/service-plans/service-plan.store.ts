// Service Plan Store - State management
import { useState, useEffect, useCallback } from 'react';
import { servicePlanApi } from './service-plan.api';
import type { ServicePlan } from './service-plan.types';

// Hook: useServicePlans
export function useServicePlans() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setPlans([]);
        setLoading(false);
        return;
      }

      const data = await servicePlanApi.getAll();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load service plans');
      console.error('Error loading service plans:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const refresh = useCallback(() => {
    loadPlans();
  }, [loadPlans]);

  return { plans, loading, error, refresh };
}

// Hook: useServicePlan (single)
export function useServicePlan(id: string | undefined) {
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setPlan(null);
      setLoading(false);
      return;
    }

    const loadPlan = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          setPlan(null);
          setLoading(false);
          return;
        }

        const data = await servicePlanApi.getById(id);
        setPlan(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load service plan');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await servicePlanApi.getById(id);
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh service plan');
    } finally {
      setLoading(false);
    }
  };

  return { plan, loading, error, refresh };
}
