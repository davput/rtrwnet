// MikroTik Interface Service
// Based on API_DOCUMENTATION.md
import { MikrotikInterface, InterfaceTraffic, InterfaceStats, VLANConfig, BondingConfig } from '@/types/mikrotik/interface';

const API_BASE_URL = import.meta.env.VITE_MIKROTIK_API_URL || 'http://localhost:8081/api/v1';

export const mikrotikInterfaceService = {
  // Get all interfaces - uses /system/interfaces from API doc
  async getAll(): Promise<MikrotikInterface[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/interfaces`);
      if (!response.ok) {
        console.warn(`Interface API returned ${response.status}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.warn('Error fetching interfaces:', error.message);
      return [];
    }
  },

  // Get interface by name
  async getByName(name: string): Promise<MikrotikInterface | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/${encodeURIComponent(name)}`);
      if (!response.ok) return null;
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn('Error fetching interface:', error);
      return null;
    }
  },

  // Enable interface
  async enable(name: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/${encodeURIComponent(name)}/enable`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error enabling interface:', error);
      return false;
    }
  },

  // Disable interface
  async disable(name: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/${encodeURIComponent(name)}/disable`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error disabling interface:', error);
      return false;
    }
  },

  // Get interface traffic (real-time)
  async getTraffic(name: string): Promise<InterfaceTraffic | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/${encodeURIComponent(name)}/traffic`);
      if (!response.ok) return null;
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn('Error fetching traffic:', error);
      return null;
    }
  },

  // Get interface statistics
  async getStats(): Promise<InterfaceStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/stats`);
      if (!response.ok) throw new Error('Failed to get stats');
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn('Error fetching stats:', error);
      return {
        total_interfaces: 0,
        running_interfaces: 0,
        disabled_interfaces: 0,
        total_rx_bytes: '0',
        total_tx_bytes: '0',
      };
    }
  },

  // Get VLANs
  async getVLANs(): Promise<VLANConfig[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/vlan/list`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching VLANs:', error);
      return [];
    }
  },

  // Get bonding configurations
  async getBondings(): Promise<BondingConfig[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/bonding/list`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching bondings:', error);
      return [];
    }
  },

  // Reset interface counters
  async resetCounters(name: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/interface/${encodeURIComponent(name)}/reset-counters`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error resetting counters:', error);
      return false;
    }
  },
};
