// Ticket Service - Mock Implementation
import type { Ticket, TicketActivity, TicketFormData } from '@/types';
import { mockTickets } from './mockData';

class TicketService {
  private tickets: Ticket[] = [...mockTickets];

  // Get tickets by customer ID
  getTicketsByCustomer(customerId: string): Ticket[] {
    return this.tickets
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Get ticket by ID
  getTicket(id: string): Ticket | undefined {
    return this.tickets.find(t => t.id === id);
  }

  // Create new ticket
  createTicket(customerId: string, customerName: string, data: TicketFormData): Ticket {
    const newTicket: Ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber: this.generateTicketNumber(),
      customerId,
      customerName,
      category: data.category,
      priority: data.priority,
      status: 'open',
      description: data.description,
      assignedTo: data.assignedTo,
      assignedUserName: data.assignedTo ? 'Teknisi' : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activities: [
        {
          id: `act-${Date.now()}`,
          ticketId: `ticket-${Date.now()}`,
          activityType: 'comment',
          description: 'Tiket dibuat',
          createdBy: 'admin',
          createdByName: 'Admin',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    this.tickets.push(newTicket);
    return newTicket;
  }

  // Update ticket status
  updateTicketStatus(ticketId: string, status: Ticket['status']): Ticket | undefined {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return undefined;

    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    // Add activity
    this.addActivity(ticketId, {
      activityType: 'status_change',
      description: `Status diubah ke ${this.getStatusLabel(status)}`,
      createdBy: 'admin',
      createdByName: 'Admin',
    });

    return ticket;
  }

  // Add activity to ticket
  addActivity(ticketId: string, data: Omit<TicketActivity, 'id' | 'ticketId' | 'createdAt'>): void {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const activity: TicketActivity = {
      id: `act-${Date.now()}`,
      ticketId,
      ...data,
      createdAt: new Date().toISOString(),
    };

    if (!ticket.activities) {
      ticket.activities = [];
    }

    ticket.activities.push(activity);
    ticket.updatedAt = new Date().toISOString();
  }

  // Resolve ticket
  resolveTicket(ticketId: string, resolution: string): Ticket | undefined {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return undefined;

    ticket.status = 'resolved';
    ticket.resolution = resolution;
    ticket.resolvedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    this.addActivity(ticketId, {
      activityType: 'resolution',
      description: 'Tiket diselesaikan',
      createdBy: 'admin',
      createdByName: 'Admin',
    });

    return ticket;
  }

  // Close ticket
  closeTicket(ticketId: string): Ticket | undefined {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) return undefined;

    ticket.status = 'closed';
    ticket.closedAt = new Date().toISOString();
    ticket.updatedAt = new Date().toISOString();

    return ticket;
  }

  // Generate ticket number
  private generateTicketNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const count = this.tickets.filter(t => t.ticketNumber.includes(dateStr)).length + 1;
    return `TKT-${dateStr}-${String(count).padStart(4, '0')}`;
  }

  // Get category label
  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      slow_connection: 'Koneksi Lambat',
      disconnection: 'Sering Disconnect',
      no_connection: 'Tidak Bisa Connect',
      relocation: 'Pindah Rumah',
      other: 'Lainnya',
    };
    return labels[category] || category;
  }

  // Get priority label
  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Rendah',
      medium: 'Sedang',
      high: 'Tinggi',
      urgent: 'Mendesak',
    };
    return labels[priority] || priority;
  }

  // Get status label
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return labels[status] || status;
  }

  // Get priority color
  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      low: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400',
      medium: 'text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
      high: 'text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
      urgent: 'text-red-600 bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400',
    };
    return colors[priority] || colors.medium;
  }

  // Get status color
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      open: 'text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
      in_progress: 'text-amber-600 bg-amber-100 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
      resolved: 'text-green-600 bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400',
      closed: 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[status] || colors.open;
  }
}

export const ticketService = new TicketService();
