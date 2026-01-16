// Network Topology Types

export type NodeType = 'router' | 'switch' | 'olt' | 'ont' | 'ap' | 'repeater' | 'client';
export type NodeStatus = 'online' | 'offline' | 'warning' | 'unknown';
export type LinkType = 'fiber' | 'utp' | 'wireless' | 'virtual';
export type LinkStatus = 'connected' | 'warning' | 'down' | 'unknown';
export type LayoutType = 'tree' | 'grid' | 'geographical';

export interface NetworkNode {
  id: string;
  name: string;
  type: NodeType;
  device_id?: string;
  status: NodeStatus;
  
  // Position
  position_x: number;
  position_y: number;
  latitude?: number;
  longitude?: number;
  
  // Visual
  icon?: string;
  color?: string;
  
  // Metadata
  ip_address?: string;
  mac_address?: string;
  model?: string;
  location?: string;
  notes?: string;
  
  // Performance metrics
  latency_ms?: number;
  packet_loss_percent?: number;
  uptime_seconds?: number;
  last_seen?: string;
  
  // Traffic metrics
  rx_bytes?: number;
  tx_bytes?: number;
  rx_rate?: string;
  tx_rate?: string;
  
  // Hierarchy
  parent_id?: string;
  level: number;
  
  created_at: string;
  updated_at: string;
}

export type PortStatus = 'up' | 'down' | 'disabled';

export interface DevicePort {
  id: string;
  name: string; // e.g., "ether1", "sfp1", "port1"
  type: 'ethernet' | 'sfp' | 'sfp+' | 'wireless';
  status: PortStatus;
  speed?: string; // e.g., "1Gbps", "10Gbps"
  isConnected: boolean;
  connectedTo?: string; // Link ID if connected
  connectedToNode?: string; // Node ID if connected
}

export interface NetworkLink {
  id: string;
  name?: string;
  
  // Connection
  source_node_id: string;
  target_node_id: string;
  source_port?: string; // Port name on source device
  target_port?: string; // Port name on target device
  
  // Properties
  link_type: LinkType;
  status: LinkStatus;
  
  // Performance
  bandwidth?: string;
  latency_ms?: number;
  packet_loss_percent?: number;
  
  // Visual
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  
  // Metadata
  distance_km?: number;
  notes?: string;
  
  created_at: string;
  updated_at: string;
}

export interface NetworkLayout {
  id: string;
  name: string;
  description?: string;
  layout_type: LayoutType;
  is_default: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// For visualization
export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

export interface LinkColor {
  connected: string;
  warning: string;
  down: string;
  unknown: string;
}

export const LINK_COLORS: LinkColor = {
  connected: '#22c55e', // green
  warning: '#eab308',   // yellow
  down: '#ef4444',      // red
  unknown: '#94a3b8',   // gray
};

export const NODE_COLORS: Record<NodeStatus, string> = {
  online: '#22c55e',
  offline: '#ef4444',
  warning: '#eab308',
  unknown: '#94a3b8',
};

export const NODE_TYPE_ICONS: Record<NodeType, string> = {
  router: 'Router',
  switch: 'Network',
  olt: 'Server',
  ont: 'Box',
  ap: 'Wifi',
  repeater: 'Radio',
  client: 'Monitor',
};

// Text Label Types
export interface TextLabel {
  id: string;
  text: string;
  position_x: number;
  position_y: number;
  font_size: number;
  color: string;
  background_color?: string;
  created_at: string;
  updated_at: string;
}
