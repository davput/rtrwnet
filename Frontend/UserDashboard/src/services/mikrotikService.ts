// MikroTik API Service
const API_BASE_URL = import.meta.env.VITE_MIKROTIK_API_URL || 'http://localhost:8081/api/v1';

export interface MikrotikLoginCredentials {
  host: string;
  port: string;
  username: string;
  password: string;
}

export interface SystemResources {
  uptime: string;
  version: string;
  cpu_load: string;
  free_memory: string;
  total_memory: string;
  free_hdd_space: string;
  total_hdd_space: string;
  board_name: string;
}

export interface NetworkInterface {
  name: string;
  type: string;
  running: string;
  rx_bytes: string;
  tx_bytes: string;
  rx_packet?: string;
  tx_packet?: string;
}

export interface HotspotActiveUser {
  id: string;
  user: string;
  address: string;
  mac: string;
  uptime: string;
  bytes_in: string;
  bytes_out: string;
}

export interface PPPoEActiveSession {
  name: string;
  service: string;
  caller_id: string;
  address: string;
  uptime: string;
  encoding?: string;
  session_id: string;
}

export const mikrotikService = {
  // Authentication
  async login(credentials: MikrotikLoginCredentials) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) throw new Error('Failed to get status');
    return response.json();
  },

  async logout() {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Logout failed');
    return response.json();
  },

  // System Monitoring
  async getSystemResources(): Promise<SystemResources> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/resources`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Please login first');
        }
        throw new Error('Failed to get system resources');
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        throw new Error('Backend not available - Please check if MikroTik API service is running');
      }
      throw error;
    }
  },

  async getInterfaces(): Promise<NetworkInterface[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/interfaces`);
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('401: Unauthorized - Please login first');
        }
        throw new Error('Failed to get interfaces');
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      if (error.message?.includes('Failed to fetch')) {
        console.warn('Backend not available for interfaces');
        return [];
      }
      throw error;
    }
  },

  // Hotspot
  async getActiveHotspotUsers(): Promise<HotspotActiveUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/active`);
      if (!response.ok) {
        // Log warning but don't throw - return empty array
        console.warn(`Hotspot API returned ${response.status}: ${response.statusText}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      // Always return empty array for any error - don't throw
      console.warn('Error fetching hotspot users:', error.message);
      return [];
    }
  },

  // PPPoE
  async getActivePPPoESessions(): Promise<PPPoEActiveSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/active`);
      if (!response.ok) {
        // Log warning but don't throw - return empty array
        console.warn(`PPPoE API returned ${response.status}: ${response.statusText}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      // Always return empty array for any error - don't throw
      console.warn('Error fetching PPPoE sessions:', error.message);
      return [];
    }
  },

  // DHCP
  async getDHCPServers(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/servers`);
      if (!response.ok) {
        console.warn(`DHCP servers API returned ${response.status}: ${response.statusText}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.warn('Error fetching DHCP servers:', error.message);
      return [];
    }
  },

  async getDHCPLeases(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/leases`);
      if (!response.ok) {
        console.warn(`DHCP leases API returned ${response.status}: ${response.statusText}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.warn('Error fetching DHCP leases:', error.message);
      return [];
    }
  },

  // WebSocket
  connectWebSocket(onMessage: (data: any) => void): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws').replace('/api/v1', '/ws');
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return ws;
  },
};
