import { usePlanLimits } from '@/contexts/PlanLimitsContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LimitWarningProps {
  resource: 'customers' | 'users' | 'devices' | 'hotspots';
  threshold?: number; // Show warning when usage >= threshold% (default 80)
}

const resourceLabels = {
  customers: 'pelanggan',
  users: 'user',
  devices: 'perangkat',
  hotspots: 'hotspot',
};

/**
 * LimitWarning - Shows a warning when resource usage is near limit
 */
export function LimitWarning({ resource, threshold = 80 }: LimitWarningProps) {
  const { limits, getResourceUsagePercent } = usePlanLimits();
  const navigate = useNavigate();

  if (!limits) return null;

  const usagePercent = getResourceUsagePercent(resource);
  
  if (usagePercent < threshold) return null;

  const isAtLimit = usagePercent >= 100;

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? `Batas ${resourceLabels[resource]} tercapai` : `Hampir mencapai batas ${resourceLabels[resource]}`}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {isAtLimit 
            ? `Anda tidak dapat menambah ${resourceLabels[resource]} lagi. Upgrade paket untuk menambah kapasitas.`
            : `Penggunaan ${resourceLabels[resource]} Anda sudah ${usagePercent}%. Pertimbangkan untuk upgrade.`
          }
        </span>
        <Button size="sm" variant="outline" onClick={() => navigate('/billing')} className="ml-4 gap-1">
          <Crown className="h-3 w-3" />
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * TrialBanner - Shows trial status banner
 */
export function TrialBanner() {
  const { isTrialActive, getTrialDaysRemaining, limits } = usePlanLimits();
  const navigate = useNavigate();

  if (!isTrialActive()) return null;

  const daysRemaining = getTrialDaysRemaining();
  const isUrgent = daysRemaining <= 3;

  return (
    <Alert variant={isUrgent ? "destructive" : "default"} className="mb-4">
      <Crown className="h-4 w-4" />
      <AlertTitle>
        {isUrgent ? "Trial Hampir Berakhir!" : "Mode Trial Aktif"}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          {daysRemaining === 0 
            ? "Trial Anda berakhir hari ini. Upgrade sekarang untuk melanjutkan."
            : `Trial Anda akan berakhir dalam ${daysRemaining} hari. Upgrade untuk akses penuh.`
          }
        </span>
        <Button 
          size="sm" 
          variant={isUrgent ? "default" : "outline"} 
          onClick={() => navigate('/billing')} 
          className="ml-4"
        >
          Upgrade Sekarang
        </Button>
      </AlertDescription>
    </Alert>
  );
}
