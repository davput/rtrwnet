// MikroTik PPPoE Types
// Based on PPPOE_API_DOCUMENTATION.md

export interface PPPoESecret {
  name: string;
  password?: string;
  service: string;
  profile: string;
  local_address?: string;
  remote_address?: string;
  comment?: string;
}

export interface PPPoEActiveSession {
  name: string;
  service: string;
  caller_id: string;
  address: string;
  uptime: string;
  encoding?: string;
  session_id: string;
  limit_bytes_in?: string;
  limit_bytes_out?: string;
}

export interface PPPoEProfile {
  name: string;
  local_address?: string;
  remote_address?: string;
  rate_limit?: string;
  session_timeout?: string;
  idle_timeout?: string;
}

export interface PPPoEStats {
  total_secrets: number;
  active_sessions: number;
  disabled_secrets: number;
}

export interface CreatePPPoESecretRequest {
  name: string;
  password: string;
  service?: string;
  profile?: string;
  comment?: string;
}
