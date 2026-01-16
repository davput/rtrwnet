import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as supportTicketsApi from '@/api/support-tickets.api';
import type { CreateSupportTicketRequest } from '@/api/support-tickets.api';

export function useSupportTickets(params?: {
  page?: number;
  per_page?: number;
  status?: string;
}) {
  return useQuery({
    queryKey: ['support-tickets', params],
    queryFn: () => supportTicketsApi.getSupportTickets(params),
    select: (res) => res.data,
  });
}

export function useSupportTicketStats() {
  return useQuery({
    queryKey: ['support-tickets', 'stats'],
    queryFn: () => supportTicketsApi.getSupportTicketStats(),
    select: (res) => res.data,
  });
}

export function useSupportTicket(id: string) {
  return useQuery({
    queryKey: ['support-tickets', id],
    queryFn: () => supportTicketsApi.getSupportTicket(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateSupportTicketRequest) => 
      supportTicketsApi.createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}

export function useAddSupportTicketReply() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: string; message: string }) =>
      supportTicketsApi.addSupportTicketReply(ticketId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}
