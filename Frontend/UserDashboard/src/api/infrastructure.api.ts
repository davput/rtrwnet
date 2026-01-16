// Infrastructure API - sesuai OpenAPI spec
import { api } from './axios';
import type {
  OLT, OLTListResponse, OLTResponse, CreateOLTRequest, UpdateOLTRequest, OLTFilters,
  ODC, ODCListResponse, ODCResponse, CreateODCRequest, UpdateODCRequest, ODCFilters,
  ODP, ODPListResponse, ODPResponse, CreateODPRequest, UpdateODPRequest, ODPFilters,
} from '@/types/infrastructure';
import type { ApiResponse } from '@/types/api';

export const infrastructureApi = {
  // ==================== OLT ====================
  /**
   * Get OLTs list
   * GET /infrastructure/olts
   */
  getOLTs: (filters?: OLTFilters) =>
    api.get<OLTListResponse>('/infrastructure/olts', filters),

  /**
   * Get OLT by ID
   * GET /infrastructure/olts/:id
   */
  getOLTById: (id: string) =>
    api.get<OLTResponse>(`/infrastructure/olts/${id}`),

  /**
   * Create a new OLT
   * POST /infrastructure/olts
   */
  createOLT: (data: CreateOLTRequest) =>
    api.post<OLTResponse>('/infrastructure/olts', data),

  /**
   * Update an OLT
   * PUT /infrastructure/olts/:id
   */
  updateOLT: (id: string, data: UpdateOLTRequest) =>
    api.put<OLTResponse>(`/infrastructure/olts/${id}`, data),

  /**
   * Delete an OLT
   * DELETE /infrastructure/olts/:id
   */
  deleteOLT: (id: string) =>
    api.delete<ApiResponse>(`/infrastructure/olts/${id}`),

  // ==================== ODC ====================
  /**
   * Get ODCs list
   * GET /infrastructure/odcs
   */
  getODCs: (filters?: ODCFilters) =>
    api.get<ODCListResponse>('/infrastructure/odcs', filters),

  /**
   * Get ODC by ID
   * GET /infrastructure/odcs/:id
   */
  getODCById: (id: string) =>
    api.get<ODCResponse>(`/infrastructure/odcs/${id}`),

  /**
   * Create a new ODC
   * POST /infrastructure/odcs
   */
  createODC: (data: CreateODCRequest) =>
    api.post<ODCResponse>('/infrastructure/odcs', data),

  /**
   * Update an ODC
   * PUT /infrastructure/odcs/:id
   */
  updateODC: (id: string, data: UpdateODCRequest) =>
    api.put<ODCResponse>(`/infrastructure/odcs/${id}`, data),

  /**
   * Delete an ODC
   * DELETE /infrastructure/odcs/:id
   */
  deleteODC: (id: string) =>
    api.delete<ApiResponse>(`/infrastructure/odcs/${id}`),

  // ==================== ODP ====================
  /**
   * Get ODPs list
   * GET /infrastructure/odps
   */
  getODPs: (filters?: ODPFilters) =>
    api.get<ODPListResponse>('/infrastructure/odps', filters),

  /**
   * Get ODP by ID
   * GET /infrastructure/odps/:id
   */
  getODPById: (id: string) =>
    api.get<ODPResponse>(`/infrastructure/odps/${id}`),

  /**
   * Create a new ODP
   * POST /infrastructure/odps
   */
  createODP: (data: CreateODPRequest) =>
    api.post<ODPResponse>('/infrastructure/odps', data),

  /**
   * Update an ODP
   * PUT /infrastructure/odps/:id
   */
  updateODP: (id: string, data: UpdateODPRequest) =>
    api.put<ODPResponse>(`/infrastructure/odps/${id}`, data),

  /**
   * Delete an ODP
   * DELETE /infrastructure/odps/:id
   */
  deleteODP: (id: string) =>
    api.delete<ApiResponse>(`/infrastructure/odps/${id}`),
};
