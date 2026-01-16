import { DevicePort, NodeType, NetworkLink } from "@/types/networkTopology";

// Generate default ports based on device type
export const generateDevicePorts = (
  deviceType: NodeType,
  deviceId: string,
  existingLinks: NetworkLink[] = []
): DevicePort[] => {
  const ports: DevicePort[] = [];

  // Get connected ports from existing links
  const connectedPorts = new Set<string>();
  existingLinks.forEach((link) => {
    if (link.source_node_id === deviceId && link.source_port) {
      connectedPorts.add(link.source_port);
    }
    if (link.target_node_id === deviceId && link.target_port) {
      connectedPorts.add(link.target_port);
    }
  });

  switch (deviceType) {
    case 'router':
      // Router: 5 ethernet ports + 2 SFP ports
      for (let i = 1; i <= 5; i++) {
        const portName = `ether${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'ethernet',
          status: 'up',
          speed: '1Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      for (let i = 1; i <= 2; i++) {
        const portName = `sfp${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'sfp+',
          status: 'up',
          speed: '10Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      break;

    case 'switch':
      // Switch: 24 ethernet ports + 2 SFP ports
      for (let i = 1; i <= 24; i++) {
        const portName = `port${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'ethernet',
          status: 'up',
          speed: '1Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      for (let i = 1; i <= 2; i++) {
        const portName = `sfp${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'sfp',
          status: 'up',
          speed: '1Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      break;

    case 'olt':
      // OLT: 4 uplink ports + 16 PON ports
      for (let i = 1; i <= 4; i++) {
        const portName = `uplink${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'sfp+',
          status: 'up',
          speed: '10Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      for (let i = 1; i <= 16; i++) {
        const portName = `pon${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'sfp',
          status: 'up',
          speed: '2.5Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      break;

    case 'ont':
      // ONT: 1 PON port + 4 ethernet ports
      ports.push({
        id: `${deviceId}-pon1`,
        name: 'pon1',
        type: 'sfp',
        status: 'up',
        speed: '1Gbps',
        isConnected: connectedPorts.has('pon1'),
      });
      for (let i = 1; i <= 4; i++) {
        const portName = `lan${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'ethernet',
          status: 'up',
          speed: '1Gbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      break;

    case 'ap':
      // Access Point: 1 ethernet port + 1 wireless
      ports.push({
        id: `${deviceId}-eth1`,
        name: 'eth1',
        type: 'ethernet',
        status: 'up',
        speed: '1Gbps',
        isConnected: connectedPorts.has('eth1'),
      });
      ports.push({
        id: `${deviceId}-wlan1`,
        name: 'wlan1',
        type: 'wireless',
        status: 'up',
        speed: '300Mbps',
        isConnected: connectedPorts.has('wlan1'),
      });
      break;

    case 'repeater':
      // Repeater: 2 wireless ports
      for (let i = 1; i <= 2; i++) {
        const portName = `wlan${i}`;
        ports.push({
          id: `${deviceId}-${portName}`,
          name: portName,
          type: 'wireless',
          status: 'up',
          speed: '300Mbps',
          isConnected: connectedPorts.has(portName),
        });
      }
      break;

    case 'client':
      // Client: 1 ethernet port
      ports.push({
        id: `${deviceId}-eth1`,
        name: 'eth1',
        type: 'ethernet',
        status: 'up',
        speed: '1Gbps',
        isConnected: connectedPorts.has('eth1'),
      });
      break;

    default:
      // Default: 1 ethernet port
      ports.push({
        id: `${deviceId}-eth1`,
        name: 'eth1',
        type: 'ethernet',
        status: 'up',
        speed: '1Gbps',
        isConnected: connectedPorts.has('eth1'),
      });
  }

  return ports;
};

// Determine cable type based on port types
export const determineCableType = (
  sourcePortType: string,
  targetPortType: string
): 'fiber' | 'utp' | 'wireless' => {
  if (sourcePortType === 'wireless' || targetPortType === 'wireless') {
    return 'wireless';
  }
  if (
    sourcePortType.includes('sfp') ||
    targetPortType.includes('sfp')
  ) {
    return 'fiber';
  }
  return 'utp';
};

// Generate cable label
export const generateCableLabel = (
  sourceNodeName: string,
  targetNodeName: string,
  sourcePort: string,
  targetPort: string,
  cableType: string
): string => {
  const type = cableType.toUpperCase();
  return `${type}: ${sourceNodeName}[${sourcePort}] ↔ ${targetNodeName}[${targetPort}]`;
};

// Get bandwidth based on port speed
export const getBandwidthFromPort = (portSpeed?: string): string => {
  if (!portSpeed) return '1 Gbps';
  return portSpeed;
};
