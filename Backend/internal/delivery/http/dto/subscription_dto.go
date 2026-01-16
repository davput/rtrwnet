package dto

type SubscriptionPlanResponse struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Slug         string                 `json:"slug"`
	Description  string                 `json:"description"`
	Price        float64                `json:"price"`
	BillingCycle string                 `json:"billing_cycle"`
	MaxCustomers int                    `json:"max_customers"`
	MaxUsers     int                    `json:"max_users"`
	Features     map[string]interface{} `json:"features"`
	IsActive     bool                   `json:"is_active"`
}

type SignUpRequest struct {
	ISPName   string `json:"isp_name" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	Phone     string `json:"phone" binding:"required"`
	PlanID    string `json:"plan_id" binding:"required"`
	OwnerName string `json:"owner_name" binding:"required"`
	UseTrial  bool   `json:"use_trial"` // Enable 7-day trial
}

type SignUpResponse struct {
	TenantID   string  `json:"tenant_id"`
	UserID     string  `json:"user_id"`
	OrderID    string  `json:"order_id,omitempty"`
	Amount     float64 `json:"amount,omitempty"`
	PaymentURL string  `json:"payment_url,omitempty"`
	SnapToken  string  `json:"snap_token,omitempty"`
	IsTrial    bool    `json:"is_trial"`
	TrialEnds  string  `json:"trial_ends,omitempty"`
	Message    string  `json:"message"`
}

type PaymentWebhookRequest struct {
	OrderID              string  `json:"order_id"`
	Status               string  `json:"status"`
	Amount               float64 `json:"amount"`
	PaymentMethod        string  `json:"payment_method"`
	GatewayTransactionID string  `json:"gateway_transaction_id"`
	Signature            string  `json:"signature"`
}

// CreatePaymentRequest for custom payment with selected method
type CreatePaymentRequest struct {
	OrderID       string `json:"order_id" binding:"required"`
	PaymentMethod string `json:"payment_method" binding:"required"` // bca_va, bni_va, bri_va, mandiri_bill, gopay, shopeepay, qris
}

// CreatePaymentResponse contains payment details
type CreatePaymentResponse struct {
	OrderID           string                 `json:"order_id"`
	PaymentType       string                 `json:"payment_type"`
	TransactionStatus string                 `json:"transaction_status"`
	GrossAmount       float64                `json:"gross_amount"`
	ExpiryTime        string                 `json:"expiry_time"`
	PaymentInfo       map[string]interface{} `json:"payment_info"`
}

// PaymentStatusResponse contains payment status
type PaymentStatusResponse struct {
	OrderID           string  `json:"order_id"`
	TransactionStatus string  `json:"transaction_status"`
	PaymentType       string  `json:"payment_type"`
	GrossAmount       float64 `json:"gross_amount"`
	PaidAt            string  `json:"paid_at,omitempty"`
}


// PlanLimitsResponse contains current plan limits and usage
type PlanLimitsResponse struct {
	PlanID       string       `json:"plan_id"`
	PlanName     string       `json:"plan_name"`
	PlanSlug     string       `json:"plan_slug"`
	IsTrial      bool         `json:"is_trial"`
	TrialEndsAt  string       `json:"trial_ends_at,omitempty"`
	Limits       PlanLimits   `json:"limits"`
	Features     PlanFeatures `json:"features"`
	Usage        PlanUsage    `json:"usage"`
	TrialConfig  TrialConfig  `json:"trial_config"`
}

// PlanLimits defines resource limits
type PlanLimits struct {
	MaxCustomers       int `json:"max_customers"`
	MaxUsers           int `json:"max_users"`
	MaxDevices         int `json:"max_devices"`
	MaxBandwidth       int `json:"max_bandwidth"`
	MaxStorage         int `json:"max_storage"`
	MaxHotspots        int `json:"max_hotspots"`
	MaxVLANs           int `json:"max_vlans"`
	MaxFirewallRules   int `json:"max_firewall_rules"`
	MaxQueueRules      int `json:"max_queue_rules"`
	MaxMonitoringDays  int `json:"max_monitoring_days"`
	MaxReports         int `json:"max_reports"`
	MaxAlerts          int `json:"max_alerts"`
	MaxAPICallsPerHour int `json:"max_api_calls_per_hour"`
	MaxWebhooks        int `json:"max_webhooks"`
}

// PlanFeatures defines available features
type PlanFeatures struct {
	CustomerManagement    bool `json:"customer_management"`
	BillingManagement     bool `json:"billing_management"`
	DeviceManagement      bool `json:"device_management"`
	NetworkMonitoring     bool `json:"network_monitoring"`
	UserManagement        bool `json:"user_management"`
	MikrotikIntegration   bool `json:"mikrotik_integration"`
	HotspotManagement     bool `json:"hotspot_management"`
	VLANManagement        bool `json:"vlan_management"`
	FirewallManagement    bool `json:"firewall_management"`
	QueueManagement       bool `json:"queue_management"`
	SpeedBoost            bool `json:"speed_boost"`
	RealTimeMonitoring    bool `json:"real_time_monitoring"`
	AdvancedReports       bool `json:"advanced_reports"`
	CustomDashboard       bool `json:"custom_dashboard"`
	DataExport            bool `json:"data_export"`
	AlertSystem           bool `json:"alert_system"`
	APIAccess             bool `json:"api_access"`
	WebhookSupport        bool `json:"webhook_support"`
	ThirdPartyIntegration bool `json:"third_party_integration"`
	CustomBranding        bool `json:"custom_branding"`
	WhiteLabel            bool `json:"white_label"`
	PrioritySupport       bool `json:"priority_support"`
	PhoneSupport          bool `json:"phone_support"`
	DedicatedManager      bool `json:"dedicated_manager"`
	CustomTraining        bool `json:"custom_training"`
}

// PlanUsage contains current resource usage
type PlanUsage struct {
	CurrentCustomers int `json:"current_customers"`
	CurrentUsers     int `json:"current_users"`
	CurrentDevices   int `json:"current_devices"`
	CurrentHotspots  int `json:"current_hotspots"`
	CurrentVLANs     int `json:"current_vlans"`
	CurrentAlerts    int `json:"current_alerts"`
	CurrentWebhooks  int `json:"current_webhooks"`
}

// TrialConfig contains trial configuration
type TrialConfig struct {
	TrialDays      int  `json:"trial_days"`
	TrialEnabled   bool `json:"trial_enabled"`
	RequirePayment bool `json:"require_payment"`
	AutoConvert    bool `json:"auto_convert"`
}

// LimitCheckResponse for checking if action is allowed
type LimitCheckResponse struct {
	Allowed       bool   `json:"allowed"`
	CurrentUsage  int    `json:"current_usage"`
	MaxAllowed    int    `json:"max_allowed"`
	ResourceType  string `json:"resource_type"`
	Message       string `json:"message,omitempty"`
}

// FeatureCheckResponse for checking if feature is enabled
type FeatureCheckResponse struct {
	Enabled     bool   `json:"enabled"`
	FeatureName string `json:"feature_name"`
	Message     string `json:"message,omitempty"`
}
