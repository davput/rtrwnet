import { useEffect, useRef, useState } from "react";
import { mikrotikService, SystemResources, NetworkInterface, HotspotActiveUser, PPPoEActiveSession } from "@/services/mikrotikService";

interface WebSocketMessage {
  type: 'system_resources' | 'interfaces' | 'hotspot_active_users' | 'pppoe_active' | 'dhcp_servers' | 'dhcp_leases';
  data: any;
}

export interface MikrotikWebSocketData {
  systemResources: SystemResources | null;
  interfaces: NetworkInterface[];
  hotspotUsers: HotspotActiveUser[];
  pppoeSession: PPPoEActiveSession[];
  dhcpServers: any[];
  dhcpLeases: any[];
  connected: boolean;
  lastUpdate: Date;
}

export const useMikrotikWebSocket = (enabled: boolean = false) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [data, setData] = useState<MikrotikWebSocketData>({
    systemResources: null,
    interfaces: [],
    hotspotUsers: [],
    pppoeSession: [],
    dhcpServers: [],
    dhcpLeases: [],
    connected: false,
    lastUpdate: new Date(),
  });

  useEffect(() => {
    if (!enabled) {
      // Disconnect if disabled
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setData(prev => ({ ...prev, connected: false }));
      return;
    }

    // Connect WebSocket
    try {
      const ws = mikrotikService.connectWebSocket((message: WebSocketMessage) => {
        setData(prev => {
          const updated = { ...prev, lastUpdate: new Date() };
          
          switch (message.type) {
            case 'system_resources':
              updated.systemResources = message.data;
              break;
            case 'interfaces':
              updated.interfaces = message.data || [];
              break;
            case 'hotspot_active_users':
              updated.hotspotUsers = message.data || [];
              break;
            case 'pppoe_active':
              updated.pppoeSession = message.data || [];
              break;
            case 'dhcp_servers':
              updated.dhcpServers = message.data || [];
              break;
            case 'dhcp_leases':
              updated.dhcpLeases = message.data || [];
              break;
          }
          
          return updated;
        });
      });

      wsRef.current = ws;

      // Set connected when WebSocket opens
      ws.addEventListener('open', () => {
        setData(prev => ({ ...prev, connected: true }));
      });

      // Set disconnected when WebSocket closes
      ws.addEventListener('close', () => {
        setData(prev => ({ ...prev, connected: false }));
      });

      ws.addEventListener('error', () => {
        setData(prev => ({ ...prev, connected: false }));
      });

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled]);

  return data;
};
