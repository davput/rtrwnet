// MikroTik DHCP Types

export interface DHCPLease {
  id: string;
  address: string;
  mac_address: string;
  client_id?: string;
  hostname?: string;
  server: string;
  status: 'bound' | 'waiting' | 'offered';
  expires_after?: string;
  last_seen?: string;
  active_address?: string;
  active_mac_address?: string;
  active_client_id?: string;
  active_server?: string;
  radius?: boolean;
  dynamic?: boolean;
  blocked?: boolean;
  disabled?: boolean;
  comment?: string;
}

export interface DHCPServer {
  id: string;
  name: string;
  interface: string;
  address_pool: string;
  lease_time: string;
  disabled: boolean;
  authoritative: string;
  bootp_support: string;
  comment?: string;
}

export interface DHCPPool {
  id: string;
  name: string;
  ranges: string; // e.g., "192.168.1.100-192.168.1.200"
  comment?: string;
}

export interface DHCPNetwork {
  id: string;
  address: string; // e.g., "192.168.1.0/24"
  gateway: string;
  dns_server?: string;
  domain?: string;
  netmask?: string;
  comment?: string;
}

export interface StaticLease {
  id: string;
  address: string;
  mac_address: string;
  server: string;
  comment?: string;
  disabled?: boolean;
}

export interface ARPEntry {
  id: string;
  address: string;
  mac_address: string;
  interface: string;
  published?: boolean;
  invalid?: boolean;
  dhcp?: boolean;
  dynamic?: boolean;
  complete?: boolean;
  disabled?: boolean;
  comment?: string;
}

export interface DHCPStats {
  total_leases: number;
  active_leases: number;
  static_leases: number;
  expired_leases: number;
  available_ips: number;
}
