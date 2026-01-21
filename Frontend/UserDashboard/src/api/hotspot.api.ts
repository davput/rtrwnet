import { api } from './axios';

// Types
export interface HotspotPackage {
  id: string;
  tenant_id: string;
  name: string;
  description: string; 
  duration_type: 'hours' | 'days';
  duration: number;
  price: number;
  speed_upload: number;
  speed_download: number;
  device_limit: number;
  mac_binding: boolean;
  session_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HotspotVoucher {
  id: string;
  tenant_id: string;
  package_id: string;
  package_name?: string;
  voucher_code: string;
  voucher_password?: string;
  status: 'unused' | 'active' | 'expired' | 'used';
  activated_at?: string;
  expires_at?: string;
  device_mac?: string;
  created_at: string;
  updated_at: string;
}

export interface HotspotSession {
  session_id: string;
  username: string;
  ip_address: string;
  mac_address: string;
  nas_ip_address: string;
  start_time: string;
  duration: string;
  upload_bytes: number;
  download_bytes: number;
  package_name: string;
  status: string;
}

export interface CaptivePortalSettings {
  id: string;
  tenant_id: string;
  logo_url: string;
  promotional_text: string;
  redirect_url: string;
  primary_color: string;
  secondary_color: string;
  updated_at: string;
}

export interface VoucherStats {
  total_vouchers: number;
  unused_vouchers: number;
  active_vouchers: number;
  expired_vouchers: number;
  used_vouchers: number;
  package_stats: Array<{
    package_id: string;
    package_name: string;
    count: number;
    revenue: number;
  }>;
  total_revenue: number;
}

// Package API
export const hotspotPackageApi = {
  list: async () => {
    const response = await api.get<{ success: boolean; data: HotspotPackage[] }>('/hotspot/packages');
    return response.data || [];
  },
  
  get: async (id: string) => {
    const response = await api.get<{ success: boolean; data: HotspotPackage }>(`/hotspot/packages/${id}`);
    return response.data;
  },
  
  create: async (data: {
    name: string;
    description?: string;
    duration_type: 'hours' | 'days';
    duration: number;
    price: number;
    speed_upload: number;
    speed_download: number;
    device_limit: number;
    mac_binding: boolean;
    session_limit: number;
  }) => {
    const response = await api.post<{ success: boolean; data: HotspotPackage }>('/hotspot/packages', data);
    return response.data;
  },
  
  update: async (id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    speed_upload: number;
    speed_download: number;
    device_limit: number;
    mac_binding: boolean;
    session_limit: number;
    is_active: boolean;
  }>) => {
    const response = await api.put<{ success: boolean; message: string }>(`/hotspot/packages/${id}`, data);
    return response;
  },
  
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/hotspot/packages/${id}`);
    return response;
  },
};

// Voucher API
export const hotspotVoucherApi = {
  generate: async (data: {
    package_id: string;
    quantity: number;
    prefix?: string;
  }) => {
    const response = await api.post<{ success: boolean; data: HotspotVoucher[] }>('/hotspot/vouchers/generate', data);
    return response.data || [];
  },
  
  list: async (params?: {
    status?: string;
    package_id?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    per_page?: number;
  }) => {
    const response = await api.get<{ 
      success: boolean; 
      data: HotspotVoucher[];
      meta?: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
      };
    }>('/hotspot/vouchers', params);
    return {
      data: response.data || [],
      pagination: response.meta || { page: 1, per_page: 20, total: 0, total_pages: 0 }
    };
  },
  
  get: async (id: string) => {
    const response = await api.get<{ success: boolean; data: HotspotVoucher }>(`/hotspot/vouchers/${id}`);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean; message: string }>(`/hotspot/vouchers/${id}`);
    return response;
  },
  
  stats: async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.get<{ success: boolean; data: VoucherStats }>('/hotspot/vouchers/stats', params);
    return response.data;
  },
};

// Session API
export const hotspotSessionApi = {
  list: async () => {
    const response = await api.get<{ success: boolean; data: HotspotSession[] }>('/hotspot/sessions');
    return response.data || [];
  },
  
  disconnect: async (sessionId: string) => {
    const response = await api.post<{ success: boolean; message: string }>(`/hotspot/sessions/${sessionId}/disconnect`);
    return response;
  },
};

// Captive Portal API
export const captivePortalApi = {
  getSettings: async () => {
    const response = await api.get<{ success: boolean; data: CaptivePortalSettings }>('/hotspot/portal/settings');
    return response.data;
  },
  
  updateSettings: async (data: {
    logo_url?: string;
    promotional_text?: string;
    redirect_url?: string;
    primary_color?: string;
    secondary_color?: string;
  }) => {
    const response = await api.put<{ success: boolean; message: string }>('/hotspot/portal/settings', data);
    return response;
  },
};
