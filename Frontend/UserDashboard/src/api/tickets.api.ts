// Tickets API - sesuai OpenAPI spec
import { api } from './axios';
import type {
  TicketFilters,
  TicketListResponse,
  TicketResponse,
  TicketDetailResponse,
  CreateTicketRequest,
  UpdateTicketRequest,
  AssignTicketRequest,
  ResolveTicketRequest,
} from '@/types/ticket';
import type { ApiResponse } from '@/types/api';

export const ticketsApi = {
  /**
   * Get tickets list with filters
   * GET /tickets
   */
  getTickets: (filters?: TicketFilters) =>
    api.get<TicketListResponse>('/tickets', filters),

  /**
   * Get ticket detail by ID
   * GET /tickets/:id
   */
  getTicketById: (id: string) =>
    api.get<TicketDetailResponse>(`/tickets/${id}`),

  /**
   * Create a new ticket
   * POST /tickets
   */
  createTicket: (data: CreateTicketRequest) =>
    api.post<TicketResponse>('/tickets', data),

  /**
   * Update a ticket
   * PUT /tickets/:id
   */
  updateTicket: (id: string, data: UpdateTicketRequest) =>
    api.put<TicketResponse>(`/tickets/${id}`, data),

  /**
   * Assign ticket to a user
   * POST /tickets/:id/assign
   */
  assignTicket: (id: string, data: AssignTicketRequest) =>
    api.post<ApiResponse>(`/tickets/${id}/assign`, data),

  /**
   * Resolve a ticket
   * POST /tickets/:id/resolve
   */
  resolveTicket: (id: string, data: ResolveTicketRequest) =>
    api.post<ApiResponse>(`/tickets/${id}/resolve`, data),

  /**
   * Close a ticket
   * POST /tickets/:id/close
   */
  closeTicket: (id: string) =>
    api.post<ApiResponse>(`/tickets/${id}/close`),
};
