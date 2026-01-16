// Ticket Types - sesuai OpenAPI spec

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketSummary {
  id: string;
  ticket_number: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  customer_id: string;
  customer_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketDetail extends TicketSummary {
  description: string;
  resolution_notes: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  activities: TicketActivity[];
}

export interface TicketActivity {
  id: string;
  action: string;
  description: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export interface CreateTicketRequest {
  customer_id: string;
  title: string;
  description: string;
  priority: TicketPriority;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
}

export interface AssignTicketRequest {
  assigned_to: string;
}

export interface ResolveTicketRequest {
  resolution_notes: string;
}

export interface TicketFilters {
  page?: number;
  per_page?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  customer_id?: string;
  assigned_to?: string;
  search?: string;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
}

export interface TicketListResponse {
  success: boolean;
  message: string;
  data: {
    tickets: TicketSummary[];
    pagination: Pagination;
  };
}

export interface TicketResponse {
  success: boolean;
  message: string;
  data: TicketSummary;
}

export interface TicketDetailResponse {
  success: boolean;
  message: string;
  data: TicketDetail;
}
