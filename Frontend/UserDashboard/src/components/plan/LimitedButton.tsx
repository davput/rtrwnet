import { ReactNode } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { usePlanLimits } from '@/contexts/PlanLimitsContext';
import { Lock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LimitedButtonProps extends ButtonProps {
  limitType: 'customer' | 'user' | 'device' | 'hotspot';
  children: ReactNode;
}

/**
 * LimitedButton - A button that is disabled when resource limit is reached
 */
export function LimitedButton({ limitType, children, disabled, ...props }: LimitedButtonProps) {
  const { canAddCustomer, canAddUser, canAddDevice, canAddHotspot, limits } = usePlanLimits();

  const canAdd = () => {
    switch (limitType) {
      case 'customer': return canAddCustomer();
      case 'user': return canAddUser();
      case 'device': return canAddDevice();
      case 'hotspot': return canAddHotspot();
      default: return true;
    }
  };

  const getLimitInfo = () => {
    if (!limits) return { current: 0, max: 0 };
    switch (limitType) {
      case 'customer': return { current: limits.usage.current_customers, max: limits.limits.max_customers };
      case 'user': return { current: limits.usage.current_users, max: limits.limits.max_users };
      case 'device': return { current: limits.usage.current_devices, max: limits.limits.max_devices };
      case 'hotspot': return { current: limits.usage.current_hotspots, max: limits.limits.max_hotspots };
      default: return { current: 0, max: -1 };
    }
  };

  const labelMap = {
    customer: 'pelanggan',
    user: 'user',
    device: 'perangkat',
    hotspot: 'hotspot',
  };

  const isLimitReached = !canAdd();
  const { current, max } = getLimitInfo();
  const isDisabled = disabled || isLimitReached;

  if (isLimitReached && max !== -1) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button {...props} disabled className="gap-2">
                <Lock className="h-4 w-4" />
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Batas {labelMap[limitType]} tercapai ({current}/{max})</p>
            <p className="text-xs text-muted-foreground">Upgrade paket untuk menambah lebih banyak</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button {...props} disabled={isDisabled}>
      {children}
    </Button>
  );
}

export default LimitedButton;
