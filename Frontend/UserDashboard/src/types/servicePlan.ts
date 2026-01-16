// Service Plan Types - sesuai OpenAPI spec

export interface ServicePlanSummary {
  id: string;
  name: string;
  description: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active: boolean;
  customer_count: number;
}

export interface ServicePlanInfo {
  id: string;
  name: string;
  speed_download: number;
  speed_upload: number;
  price: number;
}

export interface CreateServicePlanRequest {
  name: string;
  description?: string;
  speed_download: number;
  speed_upload: number;
  price: number;
}

export interface UpdateServicePlanRequest {
  name: string;
  description?: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active?: boolean;
}

export interface ServicePlanListResponse {
  success: boolean;
  message: string;
  data: {
    plans: ServicePlanSummary[];
    total: number;
  };
}

export interface ServicePlanResponse {
  success: boolean;
  message: string;
  data: ServicePlanSummary;
}

// Legacy types for backward compatibility
export interface ServicePlan {
  id: string;
  name: string;
  bandwidth_download: number;
  bandwidth_upload: number;
  monthly_price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ServicePlanAdvanced {
  id: string;
  service_plan_id: string;
  burst_rate_download: number | null;
  burst_rate_upload: number | null;
  burst_threshold: number | null;
  burst_time: number | null;
  is_unlimited: boolean;
  monthly_quota_gb: number | null;
  fup_threshold_gb: number | null;
  speed_after_fup_download: number | null;
  speed_after_fup_upload: number | null;
  duration_days: number;
  billing_cycle: 'daily' | 'weekly' | 'monthly';
  grace_period_days: number;
  connection_mode: 'pppoe' | 'hotspot' | 'ip_binding' | 'vlan';
  vlan_id: number | null;
  ip_pool: string | null;
  max_devices: number;
  area_coverage: string[] | null;
  time_restrictions: TimeRestriction | null;
  qos_priority: number;
  queue_type: string;
  traffic_shaping: any | null;
  addons: Addon[] | null;
  mikrotik_queue_config: any | null;
  auto_apply_to_mikrotik: boolean;
  queue_name_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeRestriction {
  start: string;
  end: string;
  days: number[];
}

export interface Addon {
  type: 'night_package' | 'speed_boost' | 'extra_quota' | 'custom';
  name: string;
  description?: string;
  speed_download?: number;
  speed_upload?: number;
  quota_gb?: number;
  time_start?: string;
  time_end?: string;
  price?: number;
  enabled: boolean;
}

export interface ServicePlanChangelog {
  id: string;
  service_plan_id: string;
  changed_by: string;
  change_type: 'created' | 'updated' | 'deleted' | 'activated' | 'deactivated';
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface ServicePlanComplete extends ServicePlan, Partial<Omit<ServicePlanAdvanced, 'id' | 'service_plan_id' | 'created_at' | 'updated_at'>> {
  advanced?: ServicePlanAdvanced;
  customer_count?: number;
}
