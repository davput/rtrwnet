// Settings Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings.api';
import type {
  UpdateUserSettingsRequest,
  UpdateNotificationSettingsRequest,
  UpdateTenantSettingsRequest,
  UpdateIntegrationSettingsRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from '@/types/settings';

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  user: () => [...settingsKeys.all, 'user'] as const,
  tenant: () => [...settingsKeys.all, 'tenant'] as const,
};

// ==================== USER SETTINGS ====================

/**
 * Hook to fetch user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: () => settingsApi.getUserSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update user settings
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserSettingsRequest) => settingsApi.updateUserSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
    },
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationSettingsRequest) =>
      settingsApi.updateNotificationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
    },
  });
}

// ==================== TENANT SETTINGS ====================

/**
 * Hook to fetch tenant settings
 */
export function useTenantSettings() {
  return useQuery({
    queryKey: settingsKeys.tenant(),
    queryFn: () => settingsApi.getTenantSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update tenant settings
 */
export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTenantSettingsRequest) => settingsApi.updateTenantSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tenant() });
    },
  });
}

/**
 * Hook to update integration settings
 */
export function useUpdateIntegrationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateIntegrationSettingsRequest) =>
      settingsApi.updateIntegrationSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.tenant() });
    },
  });
}

// ==================== PROFILE ====================

/**
 * Hook to update profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => settingsApi.updateProfile(data),
    onSuccess: () => {
      // Invalidate user data as well
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}

/**
 * Hook to change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => settingsApi.changePassword(data),
  });
}
