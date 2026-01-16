// Settings API - Synced with Backend
import { api } from './axios';
import type {
  UserSettings,
  TenantSettings,
  UserSettingsResponse,
  TenantSettingsResponse,
  UpdateUserSettingsRequest,
  UpdateNotificationSettingsRequest,
  UpdateTenantSettingsRequest,
  UpdateIntegrationSettingsRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/types/settings';
import type { ApiSuccessResponse } from '@/types/api';

export const settingsApi = {
  // ==================== USER SETTINGS ====================

  /**
   * GET /settings/user
   * Get current user's settings
   */
  async getUserSettings(): Promise<UserSettings> {
    const response = await api.get<UserSettingsResponse>('/settings/user');
    return response.data;
  },

  /**
   * PUT /settings/user
   * Update current user's settings
   */
  async updateUserSettings(data: UpdateUserSettingsRequest): Promise<UserSettings> {
    const response = await api.put<UserSettingsResponse>('/settings/user', data);
    return response.data;
  },

  /**
   * PUT /settings/notifications
   * Update notification preferences
   */
  async updateNotificationSettings(data: UpdateNotificationSettingsRequest): Promise<void> {
    await api.put<ApiSuccessResponse>('/settings/notifications', data);
  },

  // ==================== TENANT SETTINGS ====================

  /**
   * GET /settings/tenant
   * Get tenant/ISP settings (admin only)
   */
  async getTenantSettings(): Promise<TenantSettings> {
    const response = await api.get<TenantSettingsResponse>('/settings/tenant');
    return response.data;
  },

  /**
   * PUT /settings/tenant
   * Update tenant/ISP settings (admin only)
   */
  async updateTenantSettings(data: UpdateTenantSettingsRequest): Promise<TenantSettings> {
    const response = await api.put<TenantSettingsResponse>('/settings/tenant', data);
    return response.data;
  },

  /**
   * PUT /settings/integrations
   * Update integration settings (admin only)
   */
  async updateIntegrationSettings(data: UpdateIntegrationSettingsRequest): Promise<void> {
    await api.put<ApiSuccessResponse>('/settings/integrations', data);
  },

  // ==================== PROFILE ====================

  /**
   * PUT /settings/profile
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    await api.put<ApiSuccessResponse>('/settings/profile', data);
  },

  /**
   * PUT /settings/password
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.put<ApiSuccessResponse>('/settings/password', data);
  },
};
