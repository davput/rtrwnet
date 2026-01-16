// Infrastructure Types - sesuai OpenAPI spec

// OLT Types
export interface OLT {
  id: string;
  name: string;
  brand: string;
  model: string;
  ip_address: string;
  location: string;
  total_ports: number;
  used_ports: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOLTRequest {
  name: string;
  brand: string;
  model: string;
  ip_address: string;
  location?: string;
  total_ports: number;
}

export interface UpdateOLTRequest {
  name?: string;
  brand?: string;
  model?: string;
  ip_address?: string;
  location?: string;
  total_ports?: number;
  is_active?: boolean;
}

export interface OLTListResponse {
  success: boolean;
  message: string;
  data: OLT[];
}

export interface OLTResponse {
  success: boolean;
  message: string;
  data: OLT;
}

// ODC Types
export interface ODC {
  id: string;
  olt_id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  total_ports: number;
  used_ports: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateODCRequest {
  olt_id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  total_ports: number;
}

export interface UpdateODCRequest {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  total_ports?: number;
  is_active?: boolean;
}

export interface ODCListResponse {
  success: boolean;
  message: string;
  data: ODC[];
}

export interface ODCResponse {
  success: boolean;
  message: string;
  data: ODC;
}

// ODP Types
export interface ODP {
  id: string;
  odc_id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  total_ports: number;
  used_ports: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateODPRequest {
  odc_id: string;
  name: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  total_ports: number;
}

export interface UpdateODPRequest {
  name?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  total_ports?: number;
  is_active?: boolean;
}

export interface ODPListResponse {
  success: boolean;
  message: string;
  data: ODP[];
}

export interface ODPResponse {
  success: boolean;
  message: string;
  data: ODP;
}

// Filter types
export interface OLTFilters {
  is_active?: boolean;
}

export interface ODCFilters {
  olt_id?: string;
  is_active?: boolean;
}

export interface ODPFilters {
  odc_id?: string;
  is_active?: boolean;
}
