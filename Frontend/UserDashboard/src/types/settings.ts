// Settings Types - Synced with Backend API

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  payment_notifications: boolean;
  system_notifications: boolean;
  marketing_notifications: boolean;
  language: string;
  timezone: string;
  date_format: string;
}

export interface TenantSettings {
  id: string;
  tenant_id: string;
  // Business
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo: string;
  // Billing
  billing_type: 'prepaid' | 'postpaid';
  billing_date_type: 'fixed' | 'recycle';
  billing_day: number;
  default_due_date: number;
  grace_period_days: number;
  late_fee: number;
  late_fee_type: 'fixed' | 'percentage';
  auto_suspend_enabled: boolean;
  auto_suspend_days: number;
  auto_reactivate_on_payment: boolean;
  // Invoice
  invoice_prefix: string;
  invoice_footer: string;
  invoice_due_days: number;
  generate_invoice_days_before: number;
  tax_enabled: boolean;
  tax_percentage: number;
  // Notifications
  send_payment_reminder: boolean;
  reminder_days_before: number;
  send_overdue_notice: boolean;
  send_payment_confirmation: boolean;
  send_suspension_warning: boolean;
  warning_days_before_suspension: number;
  // Integrations
  whatsapp_enabled: boolean;
  telegram_enabled: boolean;
}

export interface UpdateUserSettingsRequest {
  email_notifications?: boolean;
  payment_notifications?: boolean;
  system_notifications?: boolean;
  marketing_notifications?: boolean;
  language?: string;
  timezone?: string;
  date_format?: string;
}

export interface UpdateNotificationSettingsRequest {
  email_notifications: boolean;
  payment_notifications: boolean;
  system_notifications: boolean;
  marketing_notifications: boolean;
}

export interface UpdateTenantSettingsRequest {
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  // Billing
  billing_type?: 'prepaid' | 'postpaid';
  billing_date_type?: 'fixed' | 'recycle';
  billing_day?: number;
  default_due_date?: number;
  grace_period_days?: number;
  late_fee?: number;
  late_fee_type?: 'fixed' | 'percentage';
  auto_suspend_enabled?: boolean;
  auto_suspend_days?: number;
  auto_reactivate_on_payment?: boolean;
  // Invoice
  invoice_prefix?: string;
  invoice_footer?: string;
  invoice_due_days?: number;
  generate_invoice_days_before?: number;
  tax_enabled?: boolean;
  tax_percentage?: number;
  // Notifications
  send_payment_reminder?: boolean;
  reminder_days_before?: number;
  send_overdue_notice?: boolean;
  send_payment_confirmation?: boolean;
  send_suspension_warning?: boolean;
  warning_days_before_suspension?: number;
}

export interface UpdateIntegrationSettingsRequest {
  whatsapp_enabled?: boolean;
  whatsapp_api_key?: string;
  telegram_enabled?: boolean;
  telegram_bot_token?: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// API Response types
export interface UserSettingsResponse {
  success: boolean;
  message: string;
  data: UserSettings;
}

export interface TenantSettingsResponse {
  success: boolean;
  message: string;
  data: TenantSettings;
}
