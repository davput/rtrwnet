// History Service - Mock Implementation
import type { CustomerHistory, ChangeType } from '@/types';
import { mockCustomerHistory } from './mockData';

class HistoryService {
  private history: CustomerHistory[] = [...mockCustomerHistory];

  // Get history by customer ID
  getHistoryByCustomer(customerId: string, filters?: {
    changeType?: ChangeType;
    startDate?: string;
    endDate?: string;
  }): CustomerHistory[] {
    let filtered = this.history.filter(h => h.customerId === customerId);

    if (filters?.changeType) {
      filtered = filtered.filter(h => h.changeType === filters.changeType);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(h => new Date(h.changedAt) >= new Date(filters.startDate!));
    }

    if (filters?.endDate) {
      filtered = filtered.filter(h => new Date(h.changedAt) <= new Date(filters.endDate!));
    }

    return filtered.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }

  // Add history entry
  addHistory(data: Omit<CustomerHistory, 'id'>): CustomerHistory {
    const newHistory: CustomerHistory = {
      ...data,
      id: `hist-${Date.now()}`,
    };

    this.history.push(newHistory);
    return newHistory;
  }

  // Get change type label
  getChangeTypeLabel(changeType: ChangeType): string {
    const labels: Record<ChangeType, string> = {
      profile_update: 'Update Profil',
      plan_change: 'Perubahan Paket',
      status_change: 'Perubahan Status',
      relocation: 'Pindah Rumah',
      payment: 'Pembayaran',
      activation: 'Aktivasi',
      registration: 'Registrasi',
    };
    return labels[changeType] || changeType;
  }

  // Get change type icon
  getChangeTypeIcon(changeType: ChangeType): string {
    const icons: Record<ChangeType, string> = {
      profile_update: 'User',
      plan_change: 'Zap',
      status_change: 'Activity',
      relocation: 'MapPin',
      payment: 'DollarSign',
      activation: 'CheckCircle',
      registration: 'UserPlus',
    };
    return icons[changeType] || 'FileText';
  }

  // Get change type color
  getChangeTypeColor(changeType: ChangeType): string {
    const colors: Record<ChangeType, string> = {
      profile_update: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      plan_change: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      status_change: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
      relocation: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      payment: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20',
      activation: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20',
      registration: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
    };
    return colors[changeType] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  }

  // Get statistics
  getStatistics(customerId: string): {
    total: number;
    byType: Record<ChangeType, number>;
  } {
    const history = this.getHistoryByCustomer(customerId);
    const byType: Record<string, number> = {};

    history.forEach(h => {
      byType[h.changeType] = (byType[h.changeType] || 0) + 1;
    });

    return {
      total: history.length,
      byType: byType as Record<ChangeType, number>,
    };
  }
}

export const historyService = new HistoryService();
