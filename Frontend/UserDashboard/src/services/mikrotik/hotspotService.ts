// MikroTik Hotspot Management Service
const API_BASE_URL = import.meta.env.VITE_MIKROTIK_API_URL || 'http://localhost:8081/api/v1';

export interface HotspotUser {
  id?: string;
  name: string;
  password?: string;
  profile: string;
  disabled?: boolean;
  comment?: string;
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

export interface HotspotProfile {
  id: string;
  name: string;
  shared_users: string;
  rate_limit?: string;
  session_timeout?: string;
  idle_timeout?: string;
}

export const hotspotService = {
  // Get all hotspot users
  async getUsers(): Promise<HotspotUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/users`);
      if (!response.ok) {
        throw new Error('Failed to get hotspot users');
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.error('Error fetching hotspot users:', error);
      throw error;
    }
  },

  // Get active hotspot users
  async getActiveUsers(): Promise<HotspotActiveUser[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/active`);
      if (!response.ok) {
        throw new Error('Failed to get active users');
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.error('Error fetching active users:', error);
      throw error;
    }
  },

  // Get hotspot profiles
  async getProfiles(): Promise<HotspotProfile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/profiles`);
      if (!response.ok) {
        throw new Error('Failed to get hotspot profiles');
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      console.error('Error fetching hotspot profiles:', error);
      return [];
    }
  },

  // Add new hotspot user
  async addUser(user: HotspotUser): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add user');
      }
    } catch (error: any) {
      console.error('Error adding hotspot user:', error);
      throw error;
    }
  },

  // Delete hotspot user
  async deleteUser(username: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/users/${username}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting hotspot user:', error);
      throw error;
    }
  },

  // Update hotspot user
  async updateUser(user: HotspotUser): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating hotspot user:', error);
      throw error;
    }
  },

  // Toggle user enabled/disabled
  async toggleUser(username: string, disabled: boolean): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/users/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username, disabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle user');
      }
    } catch (error: any) {
      console.error('Error toggling user:', error);
      throw error;
    }
  },

  // Disconnect active user
  async disconnectUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/users/disconnect/${userId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect user');
      }
    } catch (error: any) {
      console.error('Error disconnecting user:', error);
      throw error;
    }
  },

  // Add new profile
  async addProfile(profile: { name: string; rate_limit?: string; session_timeout?: string; comment?: string }): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add profile');
      }
    } catch (error: any) {
      console.error('Error adding profile:', error);
      throw error;
    }
  },

  // Delete profile
  async deleteProfile(profileId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/hotspot/profiles/${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete profile');
      }
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  },
};
