// RADIUS Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { radiusApi } from '@/api/radius.api';
import type {
  CreateNASRequest,
  UpdateNASRequest,
  CreateRadiusUserRequest,
  UpdateRadiusUserRequest,
  CreateProfileRequest,
  UpdateProfileRequest,
} from '@/types/radius';

export const radiusKeys = {
  all: ['radius'] as const,
  nas: () => [...radiusKeys.all, 'nas'] as const,
  nasList: () => [...radiusKeys.nas(), 'list'] as const,
  nasDetail: (id: string) => [...radiusKeys.nas(), 'detail', id] as const,
  users: () => [...radiusKeys.all, 'users'] as const,
  userList: (filters?: Record<string, unknown>) => [...radiusKeys.users(), 'list', filters] as const,
  userDetail: (id: string) => [...radiusKeys.users(), 'detail', id] as const,
  userSessions: (id: string) => [...radiusKeys.users(), 'sessions', id] as const,
  userUsage: (id: string) => [...radiusKeys.users(), 'usage', id] as const,
  profiles: () => [...radiusKeys.all, 'profiles'] as const,
  profileList: () => [...radiusKeys.profiles(), 'list'] as const,
  profileDetail: (id: string) => [...radiusKeys.profiles(), 'detail', id] as const,
  sessions: () => [...radiusKeys.all, 'sessions'] as const,
  activeSessions: () => [...radiusKeys.sessions(), 'active'] as const,
};

// ==================== NAS Hooks ====================

export function useNASList() {
  return useQuery({
    queryKey: radiusKeys.nasList(),
    queryFn: () => radiusApi.getNASList(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useNAS(id: string) {
  return useQuery({
    queryKey: radiusKeys.nasDetail(id),
    queryFn: () => radiusApi.getNAS(id),
    enabled: !!id,
  });
}

export function useCreateNAS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNASRequest) => radiusApi.createNAS(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.nasList() });
    },
  });
}

export function useUpdateNAS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNASRequest }) =>
      radiusApi.updateNAS(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.nasList() });
      queryClient.invalidateQueries({ queryKey: radiusKeys.nasDetail(id) });
    },
  });
}

export function useDeleteNAS() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => radiusApi.deleteNAS(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.nasList() });
    },
  });
}


// ==================== User Hooks ====================

export function useRadiusUsers(filters?: { customer_id?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: radiusKeys.userList(filters),
    queryFn: () => radiusApi.getUsers(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRadiusUser(id: string) {
  return useQuery({
    queryKey: radiusKeys.userDetail(id),
    queryFn: () => radiusApi.getUser(id),
    enabled: !!id,
  });
}

export function useCreateRadiusUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRadiusUserRequest) => radiusApi.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.userList() });
    },
  });
}

export function useUpdateRadiusUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRadiusUserRequest }) =>
      radiusApi.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.userList() });
      queryClient.invalidateQueries({ queryKey: radiusKeys.userDetail(id) });
    },
  });
}

export function useDeleteRadiusUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => radiusApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.userList() });
    },
  });
}

export function useSuspendRadiusUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => radiusApi.suspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.userList() });
    },
  });
}

export function useActivateRadiusUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => radiusApi.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.userList() });
    },
  });
}

export function useUserSessions(id: string, limit?: number) {
  return useQuery({
    queryKey: radiusKeys.userSessions(id),
    queryFn: () => radiusApi.getUserSessions(id, limit),
    enabled: !!id,
  });
}

export function useUserUsage(id: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: radiusKeys.userUsage(id),
    queryFn: () => radiusApi.getUserUsage(id, startDate, endDate),
    enabled: !!id,
  });
}

// ==================== Profile Hooks ====================

export function useRadiusProfiles() {
  return useQuery({
    queryKey: radiusKeys.profileList(),
    queryFn: () => radiusApi.getProfiles(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRadiusProfile(id: string) {
  return useQuery({
    queryKey: radiusKeys.profileDetail(id),
    queryFn: () => radiusApi.getProfile(id),
    enabled: !!id,
  });
}

export function useCreateRadiusProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProfileRequest) => radiusApi.createProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.profileList() });
    },
  });
}

export function useUpdateRadiusProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfileRequest }) =>
      radiusApi.updateProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.profileList() });
      queryClient.invalidateQueries({ queryKey: radiusKeys.profileDetail(id) });
    },
  });
}

export function useDeleteRadiusProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => radiusApi.deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.profileList() });
    },
  });
}

export function useSyncProfileFromPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (servicePlanId: string) => radiusApi.syncProfileFromPlan(servicePlanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: radiusKeys.profileList() });
    },
  });
}

// ==================== Session Hooks ====================

export function useActiveSessions() {
  return useQuery({
    queryKey: radiusKeys.activeSessions(),
    queryFn: () => radiusApi.getActiveSessions(),
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refresh every minute
  });
}
