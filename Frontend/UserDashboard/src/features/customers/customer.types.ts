// Customer Types
export type CustomerStatus = 'pending_activation' | 'active' | 'suspended' | 'inactive' | 'terminated';
export type ServiceType = 'dhcp' | 'pppoe' | 'static';

export interface Customer {
  id: string;
  customer_code: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  service_plan_id: string;
  service_plan?: ServicePlan;
  service_type: ServiceType;
  
  // PPPoE settings
  pppoe_username?: string;
  pppoe_password?: string;
  
  // Static IP settings
  static_ip?: string;
  static_gateway?: string;
  static_dns?: string;
  
  // Connection status
  is_online?: boolean;
  ip_address?: string;
  last_seen?: string;
  
  // Hotspot access
  hotspot_enabled?: boolean;
  hotspot_username?: string;
  hotspot_password?: string;
  
  status: CustomerStatus;
  installation_date?: string;
  due_date?: number;
  monthly_fee: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServicePlan {
  id: string;
  name: string;
  description?: string;
  speed_download: number;
  speed_upload: number;
  price: number;
  is_active: boolean;
  created_at?: string;
}

export interface CustomerFilters {
  status?: CustomerStatus;
  service_type?: ServiceType;
  service_plan_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface CustomerStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  pending: number;
  online: number;
  offline: number;
  totalOutstanding: number;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  service_plan_id: string;
  service_type?: ServiceType;
  
  // PPPoE settings
  pppoe_username?: string;
  pppoe_password?: string;
  
  // Static IP settings
  static_ip?: string;
  static_gateway?: string;
  static_dns?: string;
  
  installation_date?: string;
  due_date?: number;
  monthly_fee?: number;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  status?: CustomerStatus;
}
