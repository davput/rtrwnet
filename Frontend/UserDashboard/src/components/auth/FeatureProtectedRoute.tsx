import { ReactNode } from 'react';
import { usePlanLimits } from '@/contexts/PlanLimitsContext';
import { PlanFeatures } from '@/api/billing.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FeatureProtectedRouteProps {
  feature: keyof PlanFeatures;
  children: ReactNode;
  featureLabel?: string;
}

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
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

export function FeatureProtectedRoute({ feature, children, featureLabel }: FeatureProtectedRouteProps) {
  const { hasFeature, loading, limits } = usePlanLimits();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const label = featureLabel || FEATURE_LABELS[feature] || feature;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto rounded-full bg-muted p-4 mb-4">
            <Lock className="h-10 w-10 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">Fitur Tidak Tersedia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            <strong>{label}</strong> tidak tersedia di paket <strong>{limits?.plan_name || 'Anda'}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">
            Upgrade ke paket yang lebih tinggi untuk mengakses fitur ini dan fitur premium lainnya.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/billing')} className="gap-2">
              <Crown className="h-4 w-4" />
              Upgrade Paket
            </Button>
            <Button variant="outline" onClick={() => navigate('/')}>
              Kembali ke Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FeatureProtectedRoute;
