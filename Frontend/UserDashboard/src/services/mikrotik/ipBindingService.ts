// MikroTik IP Binding Service
const API_BASE_URL = import.meta.env.VITE_MIKROTIK_API_URL || 'http://localhost:8081/api/v1';

export interface IPBinding {
  id: string;
  mac_address: string;
  address: string;
  to_address: string;
  type?: string;
  server?: string;
  comment?: string;
  disabled?: boolean;
}

export interface HotspotHost {
  id: string;
  mac_address: string;
  address: string;
  to_address: string;
  server: string;
  bypassed: string;
  authorized: string;
  comment?: string;
}

export const ipBindingService = {
  // Get all IP bindings
  async getIPBindings(): Promise<IPBinding[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/ip-bindings`);
      if (!response.ok) {
        console.warn(`IP bindings API returned ${response.status}: ${response.statusText}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.warn('Error fetching IP bindings:', error.message);
      return [];
    }
  },

  // Get hotspot hosts
  async getHosts(): Promise<HotspotHost[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/hosts`);
      if (!response.ok) {
        console.warn(`Hotspot hosts API returned ${response.status}: ${response.statusText}`);
        return [];
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.warn('Error fetching hotspot hosts:', error.message);
      return [];
    }
  },

  // Add MAC binding (bypass)
  async addBinding(binding: { mac_address: string; address: string; to_address: string; comment?: string }): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/ip-bindings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(binding),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add binding');
      }
    } catch (error: any) {
      console.error('Error adding IP binding:', error);
      throw error;
    }
  },

  // Remove IP binding
  async removeBinding(bindingId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/ip-bindings/${bindingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove binding');
      }
    } catch (error: any) {
      console.error('Error removing IP binding:', error);
      throw error;
    }
  },
};
