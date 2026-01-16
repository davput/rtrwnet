import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePlanLimits } from '@/contexts/PlanLimitsContext';
import { useNavigate } from 'react-router-dom';

interface PlanLimitBannerProps {
  type: 'customer' | 'user';
  className?: string;
  alwaysShow?: boolean;
}

export function PlanLimitBanner({ type, className = '', alwaysShow = false }: PlanLimitBannerProps) {
  const navigate = useNavigate();
  const { limits, loading, error, canAddCustomer, canAddUser, getResourceUsagePercent } = usePlanLimits();

  if (loading) return null;
  
  if (error || !limits) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Gagal memuat info limit</AlertTitle>
        <AlertDescription>{error || 'Data tidak tersedia'}</AlertDescription>
      </Alert>
    );
  }

  const isCustomer = type === 'customer';
  const canAdd = isCustomer ? canAddCustomer() : canAddUser();
  const usagePercent = getResourceUsagePercent(isCustomer ? 'customers' : 'users');
  const maxLimit = isCustomer ? limits.limits.max_customers : limits.limits.max_users;
  const currentUsage = isCustomer ? limits.usage.current_customers : limits.usage.current_users;
  const label = isCustomer ? 'pelanggan' : 'user';

  if (maxLimit === -1) return null;

  if (!canAdd) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 dark:border-red-800 shadow-sm ${className}`}>
        <div className="relative flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-red-900 dark:text-red-100">
                Batas {label} tercapai
              </span>
              <span className="text-xs text-red-700 dark:text-red-300">
                {currentUsage} dari {maxLimit} {label} • Paket {limits.plan_name}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/billing')}
            className="shrink-0 bg-red-600 hover:bg-red-700 text-white shadow-md"
            size="sm"
          >
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  if (usagePercent >= 80) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-900/30 dark:border-amber-800 shadow-sm ${className}`}>
        <div className="relative flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                Mendekati batas {label}
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {currentUsage} dari {maxLimit} {label} ({usagePercent.toFixed(0)}%) • Paket {limits.plan_name}
              </span>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/billing')}
            variant="outline"
            className="shrink-0 border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900 shadow-sm"
            size="sm"
          >
            Lihat Paket
          </Button>
        </div>
      </div>
    );
  }

  if (usagePercent >= 60 || alwaysShow) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-900/30 dark:border-blue-800 shadow-sm ${className}`}>
        <div className="relative flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              Penggunaan {label}
            </span>
            <span className="text-xs text-blue-700 dark:text-blue-300">
              {currentUsage} dari {maxLimit} {label} ({usagePercent.toFixed(0)}%) • Paket {limits.plan_name}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PlanLimitBanner;
