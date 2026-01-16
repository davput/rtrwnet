/**
 * TypeScript Type Definitions for Landing Page API
 * 
 * Copy this file to your frontend project:
 * - React/Next.js: src/types/api.ts
 * - Vue: src/types/api.ts
 * - Angular: src/app/types/api.ts
 */

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Subscription Plan
 */
export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  features: string[];
  max_customers: number;
  max_users: number;
  is_active: boolean;
}

/**
 * Get Plans Response
 */
export interface GetPlansResponse {
  plans: Plan[];
}

/**
 * Sign Up Request
 */
export interface SignUpRequest {
  isp_name: string;
  subdomain: string;
  email: string;
  password: string;
  phone: string;
  plan_id: string;
  owner_name: string;
  use_trial: boolean;
}

/**
 * Trial Sign Up Response
 */
export interface TrialSignUpResponse {
  tenant_id: string;
  user_id: string;
  is_trial: true;
  trial_ends: string; // ISO date string
  message: string;
}

/**
 * Paid Sign Up Response
 */
export interface PaidSignUpResponse {
  tenant_id: string;
  user_id: string;
  order_id: string;
  amount: number;
  payment_url: string;
  is_trial: false;
  message: string;
}

/**
 * Sign Up Response (Union type)
 */
export type SignUpResponse = TrialSignUpResponse | PaidSignUpResponse;

/**
 * Error Response
 */
export interface ErrorResponse {
  error: string;
}

// ============================================================================
// Form Data Types
// ============================================================================

/**
 * Register Form Data
 */
export interface RegisterFormData {
  ispName: string;
  subdomain: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  ownerName: string;
}

/**
 * Form Validation Errors
 */
export interface FormErrors {
  ispName?: string;
  subdomain?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  ownerName?: string;
}

// ============================================================================
// API Client Types
// ============================================================================

/**
 * API Configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

/**
 * API Client Interface
 */
export interface ApiClient {
  getPlans(): Promise<GetPlansResponse>;
  signUp(data: SignUpRequest): Promise<SignUpResponse>;
}

// ============================================================================
// Helper Type Guards
// ============================================================================

/**
 * Type guard to check if response is trial signup
 */
export function isTrialSignUp(response: SignUpResponse): response is TrialSignUpResponse {
  return response.is_trial === true;
}

/**
 * Type guard to check if response is paid signup
 */
export function isPaidSignUp(response: SignUpResponse): response is PaidSignUpResponse {
  return response.is_trial === false;
}

/**
 * Type guard to check if response is error
 */
export function isErrorResponse(response: any): response is ErrorResponse {
  return 'error' in response;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
  subdomain: /^[a-z0-9-]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^08\d{8,11}$/,
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  ispName: { min: 3, max: 100 },
  subdomain: { min: 3, max: 20 },
  password: { min: 8, max: 100 },
  ownerName: { min: 3, max: 100 },
  phone: { min: 10, max: 13 },
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  ispName: {
    required: 'ISP name is required',
    minLength: `ISP name must be at least ${VALIDATION_LIMITS.ispName.min} characters`,
    maxLength: `ISP name must not exceed ${VALIDATION_LIMITS.ispName.max} characters`,
  },
  subdomain: {
    required: 'Subdomain is required',
    pattern: 'Subdomain can only contain lowercase letters, numbers, and hyphens',
    minLength: `Subdomain must be at least ${VALIDATION_LIMITS.subdomain.min} characters`,
    maxLength: `Subdomain must not exceed ${VALIDATION_LIMITS.subdomain.max} characters`,
    exists: 'Subdomain already taken. Please choose another.',
  },
  email: {
    required: 'Email is required',
    pattern: 'Invalid email address',
    exists: 'Email already registered',
  },
  password: {
    required: 'Password is required',
    minLength: `Password must be at least ${VALIDATION_LIMITS.password.min} characters`,
    weak: 'Password must contain uppercase, lowercase, and numbers',
  },
  confirmPassword: {
    required: 'Please confirm your password',
    mismatch: 'Passwords do not match',
  },
  phone: {
    required: 'Phone number is required',
    pattern: 'Phone must start with 08 and be 10-13 digits',
  },
  ownerName: {
    required: 'Owner name is required',
    minLength: `Owner name must be at least ${VALIDATION_LIMITS.ownerName.min} characters`,
  },
  planId: {
    required: 'Please select a plan',
  },
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  getPlans: '/api/v1/public/plans',
  signUp: '/api/v1/public/signup',
} as const;

// ============================================================================
// Example Usage
// ============================================================================

/**
 * Example API Client Implementation
 * 
 * ```typescript
 * import { ApiClient, ApiConfig, GetPlansResponse, SignUpRequest, SignUpResponse } from './types/api';
 * 
 * class LandingApiClient implements ApiClient {
 *   private baseUrl: string;
 *   private timeout: number;
 * 
 *   constructor(config: ApiConfig) {
 *     this.baseUrl = config.baseUrl;
 *     this.timeout = config.timeout || 30000;
 *   }
 * 
 *   async getPlans(): Promise<GetPlansResponse> {
 *     const response = await fetch(`${this.baseUrl}/api/v1/public/plans`);
 *     if (!response.ok) throw new Error('Failed to fetch plans');
 *     return await response.json();
 *   }
 * 
 *   async signUp(data: SignUpRequest): Promise<SignUpResponse> {
 *     const response = await fetch(`${this.baseUrl}/api/v1/public/signup`, {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify(data),
 *     });
 *     
 *     const result = await response.json();
 *     
 *     if (!response.ok) {
 *       throw new Error(result.error || 'Registration failed');
 *     }
 *     
 *     return result;
 *   }
 * }
 * 
 * // Usage
 * const api = new LandingApiClient({
 *   baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8089'
 * });
 * 
 * // Get plans
 * const { plans } = await api.getPlans();
 * 
 * // Sign up
 * const response = await api.signUp({
 *   isp_name: 'My ISP',
 *   subdomain: 'myisp',
 *   email: 'owner@myisp.com',
 *   password: 'secure123',
 *   phone: '08123456789',
 *   plan_id: 'plan-uuid',
 *   owner_name: 'John Doe',
 *   use_trial: true
 * });
 * 
 * if (isTrialSignUp(response)) {
 *   console.log('Trial ends:', response.trial_ends);
 * } else {
 *   console.log('Payment URL:', response.payment_url);
 * }
 * ```
 */
