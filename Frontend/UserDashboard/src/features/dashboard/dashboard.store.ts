// Dashboard Store - State management
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from './dashboard.api';
import type { DashboardOverview, DashboardStatistics, DashboardRevenue } from './dashboard.types';

// Hook: useDashboard
export function useDashboard() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setOverview(null);
        setLoading(false);
        return;
      }

      const data = await dashboardApi.getOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const refresh = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  return { 
    overview, 
    statistics: overview?.statistics,
    revenue: overview?.revenue,
    recent: overview?.recent,
    charts: overview?.charts,
    loading, 
    error, 
    refresh 
  };
}

// Hook: useDashboardStats (lightweight)
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('access_token');
        if (!token) {
          setStats(null);
          setLoading(false);
          return;
        }

        const data = await dashboardApi.getStatistics();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return { stats, loading, error };
}
