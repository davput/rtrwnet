const API_BASE_URL = import.meta.env.VITE_MIKROTIK_API_URL || 'http://localhost:8081/api/v1';

import type { 
  PPPoESecret, 
  PPPoEActiveSession, 
  PPPoEProfile,
  CreatePPPoESecretRequest 
} from '@/types/mikrotik/pppoe';

export const pppoeService = {
  // Get all PPPoE secrets
  async getSecrets(): Promise<PPPoESecret[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/secrets`);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API tidak tersedia atau belum running');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch PPPoE secrets');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching PPPoE secrets:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke backend API. Pastikan backend sudah running.');
      }
      throw error;
    }
  },

  // Get active PPPoE sessions
  async getActiveSessions(): Promise<PPPoEActiveSession[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/active`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API tidak tersedia atau belum running');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active sessions');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke backend API. Pastikan backend sudah running.');
      }
      throw error;
    }
  },

  // Get PPPoE profiles
  async getProfiles(): Promise<PPPoEProfile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/profiles`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API tidak tersedia atau belum running');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch PPPoE profiles');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching PPPoE profiles:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke backend API. Pastikan backend sudah running.');
      }
      throw error;
    }
  },

  // Add new PPPoE secret
  async addSecret(secret: CreatePPPoESecretRequest): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/secrets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(secret),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API tidak tersedia atau belum running');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create PPPoE secret');
      }
    } catch (error) {
      console.error('Error creating PPPoE secret:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke backend API. Pastikan backend sudah running.');
      }
      throw error;
    }
  },

  // Delete PPPoE secret
  async deleteSecret(name: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/secrets/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API tidak tersedia atau belum running');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete PPPoE secret');
      }
    } catch (error) {
      console.error('Error deleting PPPoE secret:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke backend API. Pastikan backend sudah running.');
      }
      throw error;
    }
  },

  // Disconnect active session
  async disconnectSession(sessionId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/pppoe/disconnect/${encodeURIComponent(sessionId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Backend API tidak tersedia atau belum running');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect session');
      }
    } catch (error) {
      console.error('Error disconnecting session:', error);
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Tidak dapat terhubung ke backend API. Pastikan backend sudah running.');
      }
      throw error;
    }
  },
};
