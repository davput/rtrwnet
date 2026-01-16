// Infrastructure Hooks - React Query integration
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { infrastructureApi } from '@/api/infrastructure.api';
import type {
  OLTFilters, CreateOLTRequest, UpdateOLTRequest,
  ODCFilters, CreateODCRequest, UpdateODCRequest,
  ODPFilters, CreateODPRequest, UpdateODPRequest,
} from '@/types/infrastructure';

// ==================== OLT Hooks ====================
export const oltKeys = {
  all: ['olts'] as const,
  lists: () => [...oltKeys.all, 'list'] as const,
  list: (filters?: OLTFilters) => [...oltKeys.lists(), filters] as const,
  details: () => [...oltKeys.all, 'detail'] as const,
  detail: (id: string) => [...oltKeys.details(), id] as const,
};

export function useOLTs(filters?: OLTFilters) {
  return useQuery({
    queryKey: oltKeys.list(filters),
    queryFn: () => infrastructureApi.getOLTs(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOLT(id: string) {
  return useQuery({
    queryKey: oltKeys.detail(id),
    queryFn: () => infrastructureApi.getOLTById(id),
    enabled: !!id,
  });
}

export function useCreateOLT() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOLTRequest) => infrastructureApi.createOLT(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oltKeys.lists() });
    },
  });
}

export function useUpdateOLT() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOLTRequest }) =>
      infrastructureApi.updateOLT(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: oltKeys.lists() });
      queryClient.invalidateQueries({ queryKey: oltKeys.detail(id) });
    },
  });
}

export function useDeleteOLT() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => infrastructureApi.deleteOLT(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: oltKeys.lists() });
    },
  });
}

// ==================== ODC Hooks ====================
export const odcKeys = {
  all: ['odcs'] as const,
  lists: () => [...odcKeys.all, 'list'] as const,
  list: (filters?: ODCFilters) => [...odcKeys.lists(), filters] as const,
  details: () => [...odcKeys.all, 'detail'] as const,
  detail: (id: string) => [...odcKeys.details(), id] as const,
};

export function useODCs(filters?: ODCFilters) {
  return useQuery({
    queryKey: odcKeys.list(filters),
    queryFn: () => infrastructureApi.getODCs(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useODC(id: string) {
  return useQuery({
    queryKey: odcKeys.detail(id),
    queryFn: () => infrastructureApi.getODCById(id),
    enabled: !!id,
  });
}

export function useCreateODC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateODCRequest) => infrastructureApi.createODC(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: odcKeys.lists() });
    },
  });
}

export function useUpdateODC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateODCRequest }) =>
      infrastructureApi.updateODC(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: odcKeys.lists() });
      queryClient.invalidateQueries({ queryKey: odcKeys.detail(id) });
    },
  });
}

export function useDeleteODC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => infrastructureApi.deleteODC(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: odcKeys.lists() });
    },
  });
}

// ==================== ODP Hooks ====================
export const odpKeys = {
  all: ['odps'] as const,
  lists: () => [...odpKeys.all, 'list'] as const,
  list: (filters?: ODPFilters) => [...odpKeys.lists(), filters] as const,
  details: () => [...odpKeys.all, 'detail'] as const,
  detail: (id: string) => [...odpKeys.details(), id] as const,
};

export function useODPs(filters?: ODPFilters) {
  return useQuery({
    queryKey: odpKeys.list(filters),
    queryFn: () => infrastructureApi.getODPs(filters),
    staleTime: 1000 * 60 * 5,
  });
}

export function useODP(id: string) {
  return useQuery({
    queryKey: odpKeys.detail(id),
    queryFn: () => infrastructureApi.getODPById(id),
    enabled: !!id,
  });
}

export function useCreateODP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateODPRequest) => infrastructureApi.createODP(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: odpKeys.lists() });
    },
  });
}

export function useUpdateODP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateODPRequest }) =>
      infrastructureApi.updateODP(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: odpKeys.lists() });
      queryClient.invalidateQueries({ queryKey: odpKeys.detail(id) });
    },
  });
}

export function useDeleteODP() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => infrastructureApi.deleteODP(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: odpKeys.lists() });
    },
  });
}
