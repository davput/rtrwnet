// Monitoring Types

export type ONUStatus = 'online' | 'offline' | 'los';

export interface ConnectionLog {
  id: string;
  customerId: string;
  pppoeUsername: string;
  loginTime: string;
  logoutTime?: string;
  durationSeconds?: number;
  ipAddress?: string;
  bytesIn?: number;
  bytesOut?: number;
  disconnectReason?: string;
}

export interface ONUMonitoring {
  id: string;
  customerId: string;
  onuSerial: string;
  rxPower: number; // dBm
  txPower: number; // dBm
  temperature: number; // Celsius
  voltage: number; // Volt
  status: ONUStatus;
  losCount: number;
  lastLosTime?: string;
  polledAt: string;
}

export interface ConnectionStatus {
  isOnline: boolean;
  ipAddress?: string;
  loginTime?: string;
  sessionDurationSeconds?: number;
  bytesIn?: number;
  bytesOut?: number;
}

export interface BandwidthUsage {
  timestamp: string;
  download: number; // Mbps
  upload: number; // Mbps;
}
