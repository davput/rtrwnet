// Devices Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devicesApi } from '@/api/devices.api';
import type { DeviceFilters, CreateDeviceRequest, UpdateDeviceRequest } from '@/types/device';

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (filters?: DeviceFilters) => [...deviceKeys.lists(), filters] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
};

/**
 * Hook to fetch devices list with filters
 */
export function useDevices(filters?: DeviceFilters) {
  return useQuery({
    queryKey: deviceKeys.list(filters),
    queryFn: () => devicesApi.getDevices(filters),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch device detail by ID
 */
export function useDevice(id: string) {
  return useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => devicesApi.getDeviceById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to create a new device
 */
export function useCreateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeviceRequest) => devicesApi.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
    },
  });
}

/**
 * Hook to update a device
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeviceRequest }) =>
      devicesApi.updateDevice(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(id) });
    },
  });
}

/**
 * Hook to delete a device
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesApi.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
    },
  });
}

/**
 * Hook to test MikroTik connection
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: (id: string) => devicesApi.testConnection(id),
  });
}

/**
 * Hook to sync MikroTik queues
 */
export function useSyncQueues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesApi.syncQueues(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(id) });
    },
  });
}
