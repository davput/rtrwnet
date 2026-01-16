import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServicePlanComplete } from "@/types/servicePlan";
import { 
  Wifi, 
  Download, 
  Upload, 
  Calendar, 
  Users, 
  Zap,
  Database,
  Shield
} from "lucide-react";

interface ServicePlanCardProps {
  plan: ServicePlanComplete;
}

export const ServicePlanCard = ({ plan }: ServicePlanCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              {plan.name}
            </CardTitle>
            {plan.description && (
              <CardDescription className="mt-1">{plan.description}</CardDescription>
            )}
          </div>
          <Badge variant={plan.is_active ? "default" : "secondary"}>
            {plan.is_active ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Download</p>
              <p className="font-medium">{plan.bandwidth_download} Mbps</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Upload</p>
              <p className="font-medium">{plan.bandwidth_upload} Mbps</p>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="pt-2 border-t">
          <p className="text-2xl font-bold">
            Rp {plan.monthly_price.toLocaleString("id-ID")}
            <span className="text-sm font-normal text-muted-foreground">/bulan</span>
          </p>
        </div>

        {/* Advanced Features */}
        {plan.advanced && (
          <div className="pt-2 border-t space-y-3">
            <p className="text-sm font-medium">Fitur Advanced:</p>
            
            {/* Burst */}
            {plan.advanced.burst_rate_download && (
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>
                  Burst: {plan.advanced.burst_rate_download}/{plan.advanced.burst_rate_upload} Mbps
                </span>
              </div>
            )}

            {/* Quota */}
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 text-blue-500" />
              <span>
                {plan.advanced.is_unlimited 
                  ? "Unlimited" 
                  : `Kuota: ${plan.advanced.monthly_quota_gb} GB/bulan`}
              </span>
            </div>

            {/* FUP */}
            {!plan.advanced.is_unlimited && plan.advanced.fup_threshold_gb && (
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-orange-500" />
                <span>
                  FUP: {plan.advanced.fup_threshold_gb} GB 
                  ({plan.advanced.speed_after_fup_download}/{plan.advanced.speed_after_fup_upload} Mbps)
                </span>
              </div>
            )}

            {/* Duration */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-green-500" />
              <span>
                Durasi: {plan.advanced.duration_days} hari
                {plan.advanced.grace_period_days > 0 && 
                  ` (Grace: ${plan.advanced.grace_period_days} hari)`}
              </span>
            </div>

            {/* Max Devices */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-purple-500" />
              <span>Max Device: {plan.advanced.max_devices}</span>
            </div>

            {/* Connection Mode */}
            <div className="text-sm">
              <Badge variant="outline">
                {plan.advanced.connection_mode.toUpperCase()}
              </Badge>
              {plan.advanced.vlan_id && (
                <Badge variant="outline" className="ml-2">
                  VLAN {plan.advanced.vlan_id}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Customer Count */}
        {plan.customer_count !== undefined && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {plan.customer_count} pelanggan menggunakan paket ini
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
