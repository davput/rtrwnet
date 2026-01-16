// MikroTik Interface Types

export interface MikrotikInterface {
  id: string;
  name: string;
  type: string; // ether, bridge, vlan, pppoe-out, etc
  mac_address?: string;
  mtu: number;
  running: boolean;
  disabled: boolean;
  comment?: string;
  
  // Traffic stats
  rx_bytes: string;
  tx_bytes: string;
  rx_packets: string;
  tx_packets: string;
  rx_errors: string;
  tx_errors: string;
  rx_drops: string;
  tx_drops: string;
  
  // Speed
  link_speed?: string;
  full_duplex?: boolean;
  
  // Status
  last_link_up_time?: string;
  last_link_down_time?: string;
}

export interface InterfaceTraffic {
  interface_name: string;
  timestamp: string;
  rx_bps: number; // bits per second
  tx_bps: number;
  rx_pps: number; // packets per second
  tx_pps: number;
}

export interface InterfaceStats {
  total_interfaces: number;
  running_interfaces: number;
  disabled_interfaces: number;
  total_rx_bytes: string;
  total_tx_bytes: string;
}

export interface VLANConfig {
  id: string;
  name: string;
  vlan_id: number;
  interface: string;
  disabled: boolean;
}

export interface BondingConfig {
  id: string;
  name: string;
  mode: string; // balance-rr, active-backup, balance-xor, etc
  slaves: string[];
  primary?: string;
  disabled: boolean;
}
