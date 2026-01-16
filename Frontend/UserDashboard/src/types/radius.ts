// RADIUS Types

export interface RadiusNAS {
  id: string;
  nasname: string;
  shortname: string;
  type: string;
  ports: number;
  server: string;
  community: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNASRequest {
  nasname: string;
  shortname: string;
  type?: string;
  ports?: number;
  secret: string;
  server?: string;
  community?: string;
  description?: string;
}

export interface UpdateNASRequest {
  nasname?: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret?: string;
  server?: string;
  community?: string;
  description?: string;
  is_active?: boolean;
}

export interface RadiusUser {
  id: string;
  customer_id?: string;
  customer_name?: string;
  username: string;
  auth_type: string;
  profile_name: string;
  ip_address: string;
  mac_address: string;
  is_active: boolean;
  simultaneous_use: number;
  expire_date?: string;
  attributes?: RadiusAttribute[];
  created_at: string;
  updated_at: string;
}

export interface RadiusAttribute {
  id: string;
  attribute: string;
  op: string;
  value: string;
  attr_type: string;
}


export interface CreateRadiusUserRequest {
  customer_id?: string;
  username: string;
  password: string;
  auth_type?: string;
  profile_name?: string;
  ip_address?: string;
  mac_address?: string;
  simultaneous_use?: number;
  expire_days?: number;
}

export interface UpdateRadiusUserRequest {
  password?: string;
  auth_type?: string;
  profile_name?: string;
  ip_address?: string;
  mac_address?: string;
  simultaneous_use?: number;
  expire_days?: number;
  is_active?: boolean;
}

export interface RadiusProfile {
  id: string;
  service_plan_id?: string;
  service_plan_name?: string;
  name: string;
  description: string;
  rate_limit_rx: number;
  rate_limit_tx: number;
  burst_limit_rx: number;
  burst_limit_tx: number;
  burst_threshold_rx: number;
  burst_threshold_tx: number;
  burst_time: number;
  session_timeout: number;
  idle_timeout: number;
  ip_pool: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileRequest {
  service_plan_id?: string;
  name: string;
  description?: string;
  rate_limit_rx?: number;
  rate_limit_tx?: number;
  burst_limit_rx?: number;
  burst_limit_tx?: number;
  burst_threshold_rx?: number;
  burst_threshold_tx?: number;
  burst_time?: number;
  session_timeout?: number;
  idle_timeout?: number;
  ip_pool?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  description?: string;
  rate_limit_rx?: number;
  rate_limit_tx?: number;
  burst_limit_rx?: number;
  burst_limit_tx?: number;
  burst_threshold_rx?: number;
  burst_threshold_tx?: number;
  burst_time?: number;
  session_timeout?: number;
  idle_timeout?: number;
  ip_pool?: string;
  is_active?: boolean;
}

export interface RadiusAccounting {
  id: string;
  username: string;
  nas_ip_address: string;
  acct_session_id: string;
  acct_start_time?: string;
  acct_stop_time?: string;
  acct_session_time: number;
  acct_input_octets: number;
  acct_output_octets: number;
  framed_ip_address: string;
  calling_station_id: string;
  acct_terminate_cause: string;
}

export interface UsageStats {
  total_sessions: number;
  total_upload: number;
  total_download: number;
  total_session_time: number;
  avg_session_time: number;
}

export type AuthType = 'pap' | 'chap' | 'mschap' | 'mschapv2';
