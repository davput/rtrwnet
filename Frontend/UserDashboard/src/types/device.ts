// Device Types - sesuai OpenAPI spec

export type DeviceType = 'mikrotik' | 'olt' | 'switch' | 'router' | 'ont';
export type DeviceStatus = 'online' | 'offline' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  device_type: DeviceType;
  brand: string;
  model: string;
  serial_number: string;
  mac_address: string;
  ip_address: string;
  username: string;
  port: number;
  customer_id: string | null;
  status: DeviceStatus;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceRequest {
  name: string;
  device_type: DeviceType;
  brand?: string;
  model?: string;
  serial_number?: string;
  mac_address?: string;
  ip_address: string;
  username?: string;
  password?: string;
  port?: number;
  customer_id?: string;
}

export interface UpdateDeviceRequest {
  name?: string;
  device_type?: DeviceType;
  brand?: string;
  model?: string;
  serial_number?: string;
  mac_address?: string;
  ip_address?: string;
  username?: string;
  password?: string;
  port?: number;
  customer_id?: string;
  status?: DeviceStatus;
}

export interface DeviceFilters {
  page?: number;
  per_page?: number;
  device_type?: DeviceType;
  status?: DeviceStatus;
  customer_id?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
}

export interface DeviceListResponse {
  success: boolean;
  message: string;
  data: {
    devices: Device[];
    pagination: Pagination;
  };
}

export interface DeviceResponse {
  success: boolean;
  message: string;
  data: Device;
}

export interface TestConnectionResponse {
  success: boolean;
  data: {
    success: boolean;
  };
}

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  mikrotik: 'MikroTik',
  olt: 'OLT',
  switch: 'Switch',
  router: 'Router',
  ont: 'ONT',
};

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  maintenance: 'Maintenance',
};
