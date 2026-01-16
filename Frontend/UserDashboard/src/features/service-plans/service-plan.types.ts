// Service Plan Types
export interface ServicePlan {
  id: string;
  name: string;
  description?: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active: boolean;
  features?: string[];
  customer_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePlanAdvanced {
  id: string;
  service_plan_id: string;
  burst_enabled: boolean;
  burst_limit: number;
  burst_threshold: number;
  burst_time: number;
  priority: number;
  max_connections: number;
  address_pool: string;
  dns_servers: string[];
  transparent_proxy: boolean;
  queue_type: string;
  parent_queue: string;
}

export interface CreateServicePlanRequest {
  name: string;
  description?: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active?: boolean;
  features?: string[];
}

export interface UpdateServicePlanRequest extends Partial<CreateServicePlanRequest> {}
