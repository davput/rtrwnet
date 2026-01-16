package entity

import (
	"time"

	"github.com/google/uuid"
)

// UserSettings represents user-specific settings
type UserSettings struct {
	ID                     uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID                 uuid.UUID `json:"user_id" gorm:"type:uuid;not null;uniqueIndex"`
	TenantID               uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;index"`
	
	// Notification Settings
	EmailNotifications     bool      `json:"email_notifications" gorm:"default:true"`
	PaymentNotifications   bool      `json:"payment_notifications" gorm:"default:true"`
	SystemNotifications    bool      `json:"system_notifications" gorm:"default:true"`
	MarketingNotifications bool      `json:"marketing_notifications" gorm:"default:false"`
	
	// Display Settings
	Language               string    `json:"language" gorm:"default:'id'"`
	Timezone               string    `json:"timezone" gorm:"default:'Asia/Jakarta'"`
	DateFormat             string    `json:"date_format" gorm:"default:'DD/MM/YYYY'"`
	
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

// TenantSettings represents tenant/ISP-wide settings
type TenantSettings struct {
	ID                     uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TenantID               uuid.UUID `json:"tenant_id" gorm:"type:uuid;not null;uniqueIndex"`
	
	// Business Settings
	CompanyName            string    `json:"company_name"`
	CompanyAddress         string    `json:"company_address"`
	CompanyPhone           string    `json:"company_phone"`
	CompanyEmail           string    `json:"company_email"`
	CompanyLogo            string    `json:"company_logo"`
	
	// Billing Settings
	BillingType            string    `json:"billing_type" gorm:"default:'postpaid'"` // prepaid or postpaid
	BillingDateType        string    `json:"billing_date_type" gorm:"default:'fixed'"` // fixed or recycle
	BillingDay             int       `json:"billing_day" gorm:"default:1"` // Day of month (1-31)
	DefaultDueDate         int       `json:"default_due_date" gorm:"default:10"` // Day of month (legacy)
	GracePeriodDays        int       `json:"grace_period_days" gorm:"default:7"`
	LateFee                float64   `json:"late_fee" gorm:"default:0"`
	LateFeeType            string    `json:"late_fee_type" gorm:"default:'fixed'"` // fixed or percentage
	AutoSuspendEnabled     bool      `json:"auto_suspend_enabled" gorm:"default:true"`
	AutoSuspendDays        int       `json:"auto_suspend_days" gorm:"default:14"` // Days after due date
	AutoReactivateOnPayment bool     `json:"auto_reactivate_on_payment" gorm:"default:true"`
	
	// Invoice Settings
	InvoicePrefix          string    `json:"invoice_prefix" gorm:"default:'INV'"`
	InvoiceFooter          string    `json:"invoice_footer"`
	InvoiceDueDays         int       `json:"invoice_due_days" gorm:"default:14"`
	GenerateInvoiceDaysBefore int    `json:"generate_invoice_days_before" gorm:"default:7"` // For prepaid
	TaxEnabled             bool      `json:"tax_enabled" gorm:"default:false"`
	TaxPercentage          float64   `json:"tax_percentage" gorm:"default:0"`
	
	// Notification Settings
	SendPaymentReminder    bool      `json:"send_payment_reminder" gorm:"default:true"`
	ReminderDaysBefore     int       `json:"reminder_days_before" gorm:"default:3"`
	SendOverdueNotice      bool      `json:"send_overdue_notice" gorm:"default:true"`
	SendPaymentConfirmation bool     `json:"send_payment_confirmation" gorm:"default:true"`
	SendSuspensionWarning  bool      `json:"send_suspension_warning" gorm:"default:true"`
	WarningDaysBeforeSuspension int  `json:"warning_days_before_suspension" gorm:"default:3"`
	
	// Integration Settings
	WhatsappEnabled        bool      `json:"whatsapp_enabled" gorm:"default:false"`
	WhatsappAPIKey         string    `json:"whatsapp_api_key"`
	TelegramEnabled        bool      `json:"telegram_enabled" gorm:"default:false"`
	TelegramBotToken       string    `json:"telegram_bot_token"`
	
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
}

func (UserSettings) TableName() string {
	return "user_settings"
}

func (TenantSettings) TableName() string {
	return "tenant_settings"
}
