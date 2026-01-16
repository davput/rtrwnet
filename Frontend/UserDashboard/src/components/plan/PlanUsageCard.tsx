import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePlanLimits } from "@/contexts/PlanLimitsContext";
import { Users, Building2, Wifi, Server, Clock, AlertTriangle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PlanUsageCard() {
  const { limits, loading, isTrialActive, getTrialDaysRemaining, getResourceUsagePercent } = usePlanLimits();
  const navigate = useNavigate();

  if (loading || !limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Penggunaan Paket</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trialDays = getTrialDaysRemaining();
  const customerPercent = getResourceUsagePercent('customers');
  const userPercent = getResourceUsagePercent('users');
  const devicePercent = getResourceUsagePercent('devices');

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatLimit = (value: number) => value === -1 ? "∞" : value.toString();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {limits.plan_name}
            </CardTitle>
            <CardDescription>Penggunaan resource saat ini</CardDescription>
          </div>
          {isTrialActive() && (
            <Badge variant={trialDays <= 3 ? "destructive" : "secondary"} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Trial: {trialDays} hari lagi
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial Warning */}
        {isTrialActive() && trialDays <= 3 && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700 dark:text-yellow-400">
              Trial Anda akan berakhir dalam {trialDays} hari. Upgrade sekarang!
            </span>
          </div>
        )}

        {/* Customers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Pelanggan</span>
            </div>
            <span className="font-medium">
              {limits.usage.current_customers} / {formatLimit(limits.limits.max_customers)}
            </span>
          </div>
          <Progress value={customerPercent} className={`h-2 ${getProgressColor(customerPercent)}`} />
        </div>

        {/* Users */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-green-500" />
              <span>Users</span>
            </div>
            <span className="font-medium">
              {limits.usage.current_users} / {formatLimit(limits.limits.max_users)}
            </span>
          </div>
          <Progress value={userPercent} className={`h-2 ${getProgressColor(userPercent)}`} />
        </div>

        {/* Devices */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-500" />
              <span>Perangkat</span>
            </div>
            <span className="font-medium">
              {limits.usage.current_devices} / {formatLimit(limits.limits.max_devices)}
            </span>
          </div>
          <Progress value={devicePercent} className={`h-2 ${getProgressColor(devicePercent)}`} />
        </div>

        {/* Hotspots */}
        {limits.features.hotspot_management && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-orange-500" />
                <span>Hotspot</span>
              </div>
              <span className="font-medium">
                {limits.usage.current_hotspots} / {formatLimit(limits.limits.max_hotspots)}
              </span>
            </div>
            <Progress value={getResourceUsagePercent('hotspots')} className="h-2" />
          </div>
        )}

        {/* Upgrade Button */}
        <Button 
          variant="outline" 
          className="w-full mt-4" 
          onClick={() => navigate('/billing')}
        >
          {isTrialActive() ? "Upgrade Sekarang" : "Lihat Paket Lainnya"}
        </Button>
      </CardContent>
    </Card>
  );
}
