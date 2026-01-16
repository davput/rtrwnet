// MikroTik Hotspot Types
// Based on API_DOCUMENTATION.md

export interface HotspotUser {
  id: string;
  name: string;
  password?: string;
  profile: string;
  disabled?: boolean;
  comment?: string;
}

export interface HotspotActiveUser {
  id: string;
  user: string;
  address: string;
  mac_address: string;
  uptime: string;
  bytes_in: string;
  bytes_out: string;
  packets_in?: string;
  packets_out?: string;
  session_time_left?: string;
}

export interface HotspotProfile {
  id: string;
  name: string;
  shared_users: string;
  rate_limit?: string;
  session_timeout?: string;
  idle_timeout?: string;
  keepalive_timeout?: string;
  status_autorefresh?: string;
}

export interface HotspotStats {
  total_users: number;
  active_users: number;
  disabled_users: number;
}
