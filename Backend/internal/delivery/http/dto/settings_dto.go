package dto

// ==================== USER SETTINGS ====================

type UserSettingsResponse struct {
	ID                     string `json:"id"`
	UserID                 string `json:"user_id"`
	EmailNotifications     bool   `json:"email_notifications"`
	PaymentNotifications   bool   `json:"payment_notifications"`
	SystemNotifications    bool   `json:"system_notifications"`
	MarketingNotifications bool   `json:"marketing_notifications"`
	Language               string `json:"language"`
	Timezone               string `json:"timezone"`
	DateFormat             string `json:"date_format"`
}

type UpdateUserSettingsRequest struct {
	EmailNotifications     *bool   `json:"email_notifications"`
	PaymentNotifications   *bool   `json:"payment_notifications"`
	SystemNotifications    *bool   `json:"system_notifications"`
	MarketingNotifications *bool   `json:"marketing_notifications"`
	Language               string  `json:"language"`
	Timezone               string  `json:"timezone"`
	DateFormat             string  `json:"date_format"`
}

type UpdateNotificationSettingsRequest struct {
	EmailNotifications     bool `json:"email_notifications"`
	PaymentNotifications   bool `json:"payment_notifications"`
	SystemNotifications    bool `json:"system_notifications"`
	MarketingNotifications bool `json:"marketing_notifications"`
}

// ==================== TENANT SETTINGS ====================

type TenantSettingsResponse struct {
	ID                  string  `json:"id"`
	TenantID            string  `json:"tenant_id"`
	
	// Business
	CompanyName         string  `json:"company_name"`
	CompanyAddress      string  `json:"company_address"`
	CompanyPhone        string  `json:"company_phone"`
	CompanyEmail        string  `json:"company_email"`
	CompanyLogo         string  `json:"company_logo"`
	
	// Billing
	BillingType         string  `json:"billing_type"`
	BillingDateType     string  `json:"billing_date_type"`
	BillingDay          int     `json:"billing_day"`
	DefaultDueDate      int     `json:"default_due_date"`
	GracePeriodDays     int     `json:"grace_period_days"`
	LateFee             float64 `json:"late_fee"`
	LateFeeType         string  `json:"late_fee_type"`
	AutoSuspendEnabled  bool    `json:"auto_suspend_enabled"`
	AutoSuspendDays     int     `json:"auto_suspend_days"`
	AutoReactivateOnPayment bool `json:"auto_reactivate_on_payment"`
	
	// Invoice
	InvoicePrefix       string  `json:"invoice_prefix"`
	InvoiceFooter       string  `json:"invoice_footer"`
	InvoiceDueDays      int     `json:"invoice_due_days"`
	GenerateInvoiceDaysBefore int `json:"generate_invoice_days_before"`
	TaxEnabled          bool    `json:"tax_enabled"`
	TaxPercentage       float64 `json:"tax_percentage"`
	
	// Notifications
	SendPaymentReminder bool    `json:"send_payment_reminder"`
	ReminderDaysBefore  int     `json:"reminder_days_before"`
	SendOverdueNotice   bool    `json:"send_overdue_notice"`
	SendPaymentConfirmation bool `json:"send_payment_confirmation"`
	SendSuspensionWarning bool  `json:"send_suspension_warning"`
	WarningDaysBeforeSuspension int `json:"warning_days_before_suspension"`
	
	// Integrations
	WhatsappEnabled     bool    `json:"whatsapp_enabled"`
	TelegramEnabled     bool    `json:"telegram_enabled"`
}

type UpdateTenantSettingsRequest struct {
	// Business
	CompanyName         string  `json:"company_name"`
	CompanyAddress      string  `json:"company_address"`
	CompanyPhone        string  `json:"company_phone"`
	CompanyEmail        string  `json:"company_email" binding:"omitempty,email"`
	
	// Billing
	BillingType         string  `json:"billing_type" binding:"omitempty,oneof=prepaid postpaid"`
	BillingDateType     string  `json:"billing_date_type" binding:"omitempty,oneof=fixed recycle"`
	BillingDay          *int    `json:"billing_day" binding:"omitempty,min=1,max=31"`
	DefaultDueDate      *int    `json:"default_due_date" binding:"omitempty,min=1,max=31"`
	GracePeriodDays     *int    `json:"grace_period_days" binding:"omitempty,min=0,max=30"`
	LateFee             *float64 `json:"late_fee" binding:"omitempty,min=0"`
	LateFeeType         string  `json:"late_fee_type" binding:"omitempty,oneof=fixed percentage"`
	AutoSuspendEnabled  *bool   `json:"auto_suspend_enabled"`
	AutoSuspendDays     *int    `json:"auto_suspend_days" binding:"omitempty,min=1,max=60"`
	AutoReactivateOnPayment *bool `json:"auto_reactivate_on_payment"`
	
	// Invoice
	InvoicePrefix       string  `json:"invoice_prefix"`
	InvoiceFooter       string  `json:"invoice_footer"`
	InvoiceDueDays      *int    `json:"invoice_due_days" binding:"omitempty,min=1,max=60"`
	GenerateInvoiceDaysBefore *int `json:"generate_invoice_days_before" binding:"omitempty,min=1,max=30"`
	TaxEnabled          *bool   `json:"tax_enabled"`
	TaxPercentage       *float64 `json:"tax_percentage" binding:"omitempty,min=0,max=100"`
	
	// Notifications
	SendPaymentReminder *bool   `json:"send_payment_reminder"`
	ReminderDaysBefore  *int    `json:"reminder_days_before" binding:"omitempty,min=1,max=14"`
	SendOverdueNotice   *bool   `json:"send_overdue_notice"`
	SendPaymentConfirmation *bool `json:"send_payment_confirmation"`
	SendSuspensionWarning *bool `json:"send_suspension_warning"`
	WarningDaysBeforeSuspension *int `json:"warning_days_before_suspension" binding:"omitempty,min=1,max=14"`
}

type UpdateIntegrationSettingsRequest struct {
	WhatsappEnabled  *bool  `json:"whatsapp_enabled"`
	WhatsappAPIKey   string `json:"whatsapp_api_key"`
	TelegramEnabled  *bool  `json:"telegram_enabled"`
	TelegramBotToken string `json:"telegram_bot_token"`
}

// ==================== PROFILE ====================

type UpdateProfileRequest struct {
	Name  string `json:"name" binding:"required,min=2"`
	Email string `json:"email" binding:"required,email"`
	Phone string `json:"phone"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required,eqfield=NewPassword"`
}
