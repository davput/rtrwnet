import { ReactNode } from 'react';
import { usePlanLimits } from '@/contexts/PlanLimitsContext';
import { PlanFeatures } from '@/api/billing.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

/**
 * FeatureGate - Conditionally renders children based on plan features
 * 
 * Usage:
 * <FeatureGate feature="hotspot_management">
 *   <HotspotManager />
 * </FeatureGate>
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { hasFeature, loading, limits } = usePlanLimits();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  const featureLabels: Record<keyof PlanFeatures, string> = {
    customer_management: "Manajemen Pelanggan",
    billing_management: "Manajemen Billing",
    device_management: "Manajemen Perangkat",
    network_monitoring: "Monitoring Jaringan",
    user_management: "Manajemen User",
    mikrotik_integration: "Integrasi Mikrotik",
    hotspot_management: "Manajemen Hotspot",
    vlan_management: "Manajemen VLAN",
    firewall_management: "Manajemen Firewall",
    queue_management: "Manajemen Queue",
    speed_boost: "Speed Boost",
    real_time_monitoring: "Monitoring Real-time",
    advanced_reports: "Laporan Lanjutan",
    custom_dashboard: "Dashboard Kustom",
    data_export: "Export Data",
    alert_system: "Sistem Alert",
    api_access: "Akses API",
    webhook_support: "Webhook Support",
    third_party_integration: "Integrasi Pihak Ketiga",
    custom_branding: "Custom Branding",
    white_label: "White Label",
    priority_support: "Support Prioritas",
    phone_support: "Support Telepon",
    dedicated_manager: "Account Manager",
    custom_training: "Training Kustom",
  };

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {featureLabels[feature]} Tidak Tersedia
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Fitur ini tidak tersedia di paket <strong>{limits?.plan_name}</strong> Anda.
          Upgrade ke paket yang lebih tinggi untuk mengakses fitur ini.
        </p>
        <Button onClick={() => navigate('/billing')} className="gap-2">
          <Crown className="h-4 w-4" />
          Upgrade Paket
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * useFeatureAccess - Hook to check feature access
 */
export function useFeatureAccess(feature: keyof PlanFeatures) {
  const { hasFeature, limits, loading } = usePlanLimits();
  
  return {
    hasAccess: hasFeature(feature),
    loading,
    planName: limits?.plan_name,
  };
}
