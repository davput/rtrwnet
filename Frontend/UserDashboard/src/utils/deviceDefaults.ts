import { NetworkNode, NodeType } from "@/types/networkTopology";

// Auto-fill templates berdasarkan device type
export const getDeviceDefaults = (type: NodeType, existingNodes: NetworkNode[]) => {
  const typeCount = existingNodes.filter(n => n.type === type).length + 1;
  
  const templates: Record<NodeType, any> = {
    router: {
      name: `Core Router ${typeCount}`,
      ip_address: `10.0.${typeCount}.1`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:01`,
      model: "MikroTik CCR1036",
      location: "Data Center",
      notes: "Core routing device untuk backbone network"
    },
    switch: {
      name: `Distribution Switch ${typeCount}`,
      ip_address: `10.1.${typeCount}.1`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:02`,
      model: "Cisco Catalyst 2960",
      location: "Distribution Room",
      notes: "Layer 2/3 switch untuk distribusi traffic"
    },
    olt: {
      name: `OLT ${typeCount}`,
      ip_address: `10.2.${typeCount}.1`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:03`,
      model: "Huawei MA5608T",
      location: "POP Site",
      notes: "Optical Line Terminal untuk distribusi fiber"
    },
    ont: {
      name: `ONT Customer ${String.fromCharCode(64 + typeCount)}`,
      ip_address: `192.168.${typeCount}.1`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:04`,
      model: "Huawei HG8245H",
      location: "Customer Premises",
      notes: "Optical Network Terminal di lokasi pelanggan"
    },
    ap: {
      name: `Access Point ${typeCount}`,
      ip_address: `192.168.${typeCount}.254`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:05`,
      model: "Ubiquiti UniFi AC Pro",
      location: `Floor ${typeCount}`,
      notes: "Wireless access point untuk coverage WiFi"
    },
    repeater: {
      name: `Repeater ${typeCount}`,
      ip_address: `192.168.${typeCount}.253`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:06`,
      model: "TP-Link RE450",
      location: "Extension Area",
      notes: "Signal repeater untuk memperluas jangkauan"
    },
    client: {
      name: `Client ${typeCount}`,
      ip_address: `192.168.${typeCount}.${100 + typeCount}`,
      mac_address: `00:1A:2B:${typeCount.toString(16).padStart(2, '0')}:00:07`,
      model: "Generic PC",
      location: "Workstation",
      notes: "End user device"
    }
  };

  return templates[type] || {};
};

// Create complete node data with defaults
export const createNodeWithDefaults = (
  type: NodeType,
  x: number,
  y: number,
  existingNodes: NetworkNode[]
): Partial<NetworkNode> => {
  const defaults = getDeviceDefaults(type, existingNodes);
  
  return {
    name: defaults.name,
    type: type,
    status: "online",
    ip_address: defaults.ip_address,
    mac_address: defaults.mac_address,
    model: defaults.model,
    location: defaults.location,
    notes: defaults.notes,
    level: 0,
    position_x: x,
    position_y: y,
  };
};
