// RADIUS API
import { api } from './axios';
import type { ApiResponse } from '@/types/api';
import type {
  RadiusNAS,
  CreateNASRequest,
  UpdateNASRequest,
  RadiusUser,
  CreateRadiusUserRequest,
  UpdateRadiusUserRequest,
  RadiusProfile,
  CreateProfileRequest,
  UpdateProfileRequest,
  RadiusAccounting,
  UsageStats,
  CustomerOnlineStatus,
} from '@/types/radius';

export const radiusApi = {
  // ==================== NAS ====================
  
  /** Get all NAS devices */
  getNASList: () => api.get<ApiResponse<RadiusNAS[]>>('/radius/nas'),

  /** Get NAS by ID */
  getNAS: (id: string) => api.get<ApiResponse<RadiusNAS>>(`/radius/nas/${id}`),

  /** Create NAS */
  createNAS: (data: CreateNASRequest) => 
    api.post<ApiResponse<RadiusNAS>>('/radius/nas', data),

  /** Update NAS */
  updateNAS: (id: string, data: UpdateNASRequest) => 
    api.put<ApiResponse<RadiusNAS>>(`/radius/nas/${id}`, data),

  /** Delete NAS */
  deleteNAS: (id: string) => api.delete<ApiResponse>(`/radius/nas/${id}`),

  // ==================== Users ====================
  
  /** Get all RADIUS users */
  getUsers: (filters?: { customer_id?: string; is_active?: boolean }) => 
    api.get<ApiResponse<RadiusUser[]>>('/radius/users', filters),

  /** Get user by ID */
  getUser: (id: string) => api.get<ApiResponse<RadiusUser>>(`/radius/users/${id}`),

  /** Create user */
  createUser: (data: CreateRadiusUserRequest) => 
    api.post<ApiResponse<RadiusUser>>('/radius/users', data),

  /** Update user */
  updateUser: (id: string, data: UpdateRadiusUserRequest) => 
    api.put<ApiResponse<RadiusUser>>(`/radius/users/${id}`, data),

  /** Delete user */
  deleteUser: (id: string) => api.delete<ApiResponse>(`/radius/users/${id}`),

  /** Suspend user */
  suspendUser: (id: string) => api.post<ApiResponse>(`/radius/users/${id}/suspend`),

  /** Activate user */
  activateUser: (id: string) => api.post<ApiResponse>(`/radius/users/${id}/activate`),

  /** Get user sessions */
  getUserSessions: (id: string, limit?: number) => 
    api.get<ApiResponse<RadiusAccounting[]>>(`/radius/users/${id}/sessions`, { limit }),

  /** Get user usage stats */
  getUserUsage: (id: string, startDate?: string, endDate?: string) => 
    api.get<ApiResponse<UsageStats>>(`/radius/users/${id}/usage`, { 
      start_date: startDate, 
      end_date: endDate 
    }),

  // ==================== Profiles ====================
  
  /** Get all profiles */
  getProfiles: () => api.get<ApiResponse<RadiusProfile[]>>('/radius/profiles'),

  /** Get profile by ID */
  getProfile: (id: string) => api.get<ApiResponse<RadiusProfile>>(`/radius/profiles/${id}`),

  /** Create profile */
  createProfile: (data: CreateProfileRequest) => 
    api.post<ApiResponse<RadiusProfile>>('/radius/profiles', data),

  /** Update profile */
  updateProfile: (id: string, data: UpdateProfileRequest) => 
    api.put<ApiResponse<RadiusProfile>>(`/radius/profiles/${id}`, data),

  /** Delete profile */
  deleteProfile: (id: string) => api.delete<ApiResponse>(`/radius/profiles/${id}`),

  /** Sync profile from service plan */
  syncProfileFromPlan: (servicePlanId: string) => 
    api.post<ApiResponse<RadiusProfile>>(`/radius/profiles/sync/${servicePlanId}`),

  // ==================== Sessions ====================
  
  /** Get active sessions */
  getActiveSessions: () => api.get<ApiResponse<RadiusAccounting[]>>('/radius/sessions/active'),

  // ==================== Online Status ====================
  
  /** Sync customer online status from radacct to customers table */
  syncOnlineStatus: () => api.post<ApiResponse>('/radius/sync-online-status'),

  /** Get customer online status (real-time from radacct) */
  getCustomerOnlineStatus: (customerId: string) => 
    api.get<ApiResponse<CustomerOnlineStatus>>(`/radius/customers/${customerId}/online-status`),
};
