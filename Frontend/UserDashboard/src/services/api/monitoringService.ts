import { apiClient } from './client';

export interface CustomerMonitoring {
  customer_id: string;
  current_status: 'online' | 'offline';
  bandwidth_usage: {
    download: number;
    upload: number;
  };
  data_usage: {
    today: number;
    this_month: number;
  };
  connection_quality: {
    latency: number;
    packet_loss: number;
    uptime_percentage: number;
  };
  history: Array<{
    timestamp: string;
    download_speed: number;
    upload_speed: number;
    latency: number;
  }>;
}

export interface NetworkOverview {
  total_bandwidth: number;
  used_bandwidth: number;
  active_connections: number;
  devices_online: number;
  devices_offline: number;
  alerts: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export const monitoringService = {
  async getCustomerMonitoring(customerId: string, period: '24h' | '7d' | '30d' = '24h'): Promise<CustomerMonitoring> {
    const response = await apiClient.get(`/monitoring/customers/${customerId}`, {
      params: { period },
    });
    return response.data;
  },

  async getNetworkOverview(): Promise<NetworkOverview> {
    const response = await apiClient.get('/monitoring/network');
    return response.data;
  },
};
