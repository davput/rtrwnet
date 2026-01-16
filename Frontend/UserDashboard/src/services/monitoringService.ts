// Monitoring Service - Mock Implementation
import type { ConnectionLog, ONUMonitoring, ConnectionStatus, BandwidthUsage } from '@/types';
import { mockConnectionLogs, mockONUMonitoring, mockBandwidthUsage } from './mockData';

class MonitoringService {
  private connectionLogs: ConnectionLog[] = [...mockConnectionLogs];
  private onuMonitoring: ONUMonitoring[] = [...mockONUMonitoring];

  // Get connection status
  getConnectionStatus(customerId: string): ConnectionStatus | null {
    const activeLog = this.connectionLogs.find(
      log => log.customerId === customerId && !log.logoutTime
    );

    if (!activeLog) {
      return {
        isOnline: false,
      };
    }

    const loginTime = new Date(activeLog.loginTime);
    const now = new Date();
    const sessionDurationSeconds = Math.floor((now.getTime() - loginTime.getTime()) / 1000);

    return {
      isOnline: true,
      ipAddress: activeLog.ipAddress,
      loginTime: activeLog.loginTime,
      sessionDurationSeconds,
      bytesIn: activeLog.bytesIn,
      bytesOut: activeLog.bytesOut,
    };
  }

  // Get connection logs
  getConnectionLogs(customerId: string, days: number = 7): ConnectionLog[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.connectionLogs
      .filter(log => 
        log.customerId === customerId && 
        new Date(log.loginTime) >= cutoffDate
      )
      .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());
  }

  // Get current ONU status
  getCurrentONUStatus(customerId: string): ONUMonitoring | null {
    const monitoring = this.onuMonitoring
      .filter(m => m.customerId === customerId)
      .sort((a, b) => new Date(b.polledAt).getTime() - new Date(a.polledAt).getTime());

    return monitoring[0] || null;
  }

  // Get ONU history
  getONUHistory(customerId: string, days: number = 7): ONUMonitoring[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.onuMonitoring
      .filter(m => 
        m.customerId === customerId && 
        new Date(m.polledAt) >= cutoffDate
      )
      .sort((a, b) => new Date(b.polledAt).getTime() - new Date(a.polledAt).getTime());
  }

  // Get bandwidth usage (mock data for chart)
  getBandwidthUsage(customerId: string): BandwidthUsage[] {
    return mockBandwidthUsage;
  }

  // Format bytes to human readable
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  // Get signal quality
  getSignalQuality(rxPower: number): { label: string; color: string } {
    if (rxPower >= -25) {
      return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    } else if (rxPower >= -27) {
      return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    } else if (rxPower >= -28) {
      return { label: 'Fair', color: 'text-amber-600 dark:text-amber-400' };
    } else {
      return { label: 'Poor', color: 'text-red-600 dark:text-red-400' };
    }
  }
}

export const monitoringService = new MonitoringService();
