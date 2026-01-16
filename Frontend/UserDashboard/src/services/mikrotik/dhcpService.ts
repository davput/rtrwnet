// MikroTik DHCP Service
// Based on API_DOCUMENTATION.md
import { DHCPLease, DHCPServer, DHCPPool, DHCPNetwork, StaticLease, ARPEntry, DHCPStats } from '@/types/mikrotik/dhcp';

const API_BASE_URL = import.meta.env.VITE_MIKROTIK_API_URL || 'http://localhost:8081/api/v1';

export const mikrotikDHCPService = {
  // DHCP Leases - uses /dhcp/leases from API doc
  async getLeases(): Promise<DHCPLease[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/leases`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching DHCP leases:', error);
      return [];
    }
  },

  async getActiveLeases(): Promise<DHCPLease[]> {
    try {
      const leases = await this.getLeases();
      return leases.filter(lease => lease.status === 'bound' && !lease.disabled);
    } catch (error) {
      return [];
    }
  },

  // Static Leases
  async getStaticLeases(): Promise<StaticLease[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/static-leases`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching static leases:', error);
      return [];
    }
  },

  async addStaticLease(lease: Omit<StaticLease, 'id'>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/static-leases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lease),
      });
      return response.ok;
    } catch (error) {
      console.error('Error adding static lease:', error);
      return false;
    }
  },

  async removeStaticLease(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/static-leases/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing static lease:', error);
      return false;
    }
  },

  // DHCP Servers
  async getServers(): Promise<DHCPServer[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/servers`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching DHCP servers:', error);
      return [];
    }
  },

  // DHCP Pools
  async getPools(): Promise<DHCPPool[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/pools`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching DHCP pools:', error);
      return [];
    }
  },

  async addPool(pool: Omit<DHCPPool, 'id'>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pool),
      });
      return response.ok;
    } catch (error) {
      console.error('Error adding pool:', error);
      return false;
    }
  },

  async removePool(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/pools/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('Error removing pool:', error);
      return false;
    }
  },

  // DHCP Networks
  async getNetworks(): Promise<DHCPNetwork[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/networks`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching DHCP networks:', error);
      return [];
    }
  },

  // ARP Table - uses /logs/arp from API doc
  async getARPTable(): Promise<ARPEntry[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/logs/arp`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch (error) {
      console.warn('Error fetching ARP table:', error);
      return [];
    }
  },

  // Statistics
  async getStats(): Promise<DHCPStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/stats`);
      if (!response.ok) throw new Error('Failed to get stats');
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn('Error fetching DHCP stats:', error);
      return {
        total_leases: 0,
        active_leases: 0,
        static_leases: 0,
        expired_leases: 0,
        available_ips: 0,
      };
    }
  },

  // Make lease static
  async makeStatic(leaseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/leases/${leaseId}/make-static`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error making lease static:', error);
      return false;
    }
  },

  // Release lease
  async releaseLease(leaseId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/dhcp/leases/${leaseId}/release`, {
        method: 'POST',
      });
      return response.ok;
    } catch (error) {
      console.error('Error releasing lease:', error);
      return false;
    }
  },
};
