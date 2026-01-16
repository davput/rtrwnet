// Devices API - sesuai OpenAPI spec
import { api } from './axios';
import type {
  DeviceFilters,
  DeviceListResponse,
  DeviceResponse,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  TestConnectionResponse,
} from '@/types/device';
import type { ApiResponse } from '@/types/api';

export const devicesApi = {
  /**
   * Get devices list with filters
   * GET /devices
   */
  getDevices: (filters?: DeviceFilters) =>
    api.get<DeviceListResponse>('/devices', filters),

  /**
   * Get device by ID
   * GET /devices/:id
   */
  getDeviceById: (id: string) =>
    api.get<DeviceResponse>(`/devices/${id}`),

  /**
   * Create a new device
   * POST /devices
   */
  createDevice: (data: CreateDeviceRequest) =>
    api.post<DeviceResponse>('/devices', data),

  /**
   * Update a device
   * PUT /devices/:id
   */
  updateDevice: (id: string, data: UpdateDeviceRequest) =>
    api.put<DeviceResponse>(`/devices/${id}`, data),

  /**
   * Delete a device
   * DELETE /devices/:id
   */
  deleteDevice: (id: string) =>
    api.delete<ApiResponse>(`/devices/${id}`),

  /**
   * Test MikroTik connection
   * POST /devices/:id/test-connection
   */
  testConnection: (id: string) =>
    api.post<TestConnectionResponse>(`/devices/${id}/test-connection`),

  /**
   * Sync MikroTik queues
   * POST /devices/:id/sync-queues
   */
  syncQueues: (id: string) =>
    api.post<ApiResponse>(`/devices/${id}/sync-queues`),
};
