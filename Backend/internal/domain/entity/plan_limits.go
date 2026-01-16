package entity

// PlanLimits defines resource limits for a subscription plan
type PlanLimits struct {
	// Basic Limits
	MaxCustomers int `json:"max_customers" gorm:"default:50"` // -1 for unlimited
	MaxUsers     int `json:"max_users" gorm:"default:2"`      // -1 for unlimited
	MaxDevices   int `json:"max_devices" gorm:"default:5"`    // -1 for unlimited
	MaxBandwidth int `json:"max_bandwidth" gorm:"default:100"` // in Mbps, -1 for unlimited
	MaxStorage   int `json:"max_storage" gorm:"default:10"`   // in GB, -1 for unlimited

	// Network Limits
	MaxHotspots      int `json:"max_hotspots" gorm:"default:2"`       // -1 for unlimited
	MaxVLANs         int `json:"max_vlans" gorm:"default:5"`          // -1 for unlimited
	MaxFirewallRules int `json:"max_firewall_rules" gorm:"default:20"` // -1 for unlimited
	MaxQueueRules    int `json:"max_queue_rules" gorm:"default:10"`   // -1 for unlimited

	// Monitoring Limits
	MaxMonitoringDays int `json:"max_monitoring_days" gorm:"default:30"` // days to keep monitoring data
	MaxReports        int `json:"max_reports" gorm:"default:5"`          // monthly reports
	MaxAlerts         int `json:"max_alerts" gorm:"default:10"`          // active alerts

	// API Limits
	MaxAPICallsPerHour int `json:"max_api_calls_per_hour" gorm:"default:100"` // -1 for unlimited
	MaxWebhooks        int `json:"max_webhooks" gorm:"default:2"`             // -1 for unlimited
}

// PlanFeatures defines available features for a subscription plan
type PlanFeatures struct {
	// Core Features
	CustomerManagement bool `json:"customer_management" gorm:"default:true"`
	BillingManagement  bool `json:"billing_management" gorm:"default:true"`
	DeviceManagement   bool `json:"device_management" gorm:"default:true"`
	NetworkMonitoring  bool `json:"network_monitoring" gorm:"default:true"`
	UserManagement     bool `json:"user_management" gorm:"default:true"`

	// Advanced Features
	MikrotikIntegration bool `json:"mikrotik_integration" gorm:"default:true"`
	HotspotManagement   bool `json:"hotspot_management" gorm:"default:false"`
	VLANManagement      bool `json:"vlan_management" gorm:"default:false"`
	FirewallManagement  bool `json:"firewall_management" gorm:"default:false"`
	QueueManagement     bool `json:"queue_management" gorm:"default:true"`
	SpeedBoost          bool `json:"speed_boost" gorm:"default:false"`

	// Monitoring & Analytics
	RealTimeMonitoring bool `json:"real_time_monitoring" gorm:"default:false"`
	AdvancedReports    bool `json:"advanced_reports" gorm:"default:false"`
	CustomDashboard    bool `json:"custom_dashboard" gorm:"default:false"`
	DataExport         bool `json:"data_export" gorm:"default:false"`
	AlertSystem        bool `json:"alert_system" gorm:"default:true"`

	// Integration Features
	APIAccess             bool `json:"api_access" gorm:"default:false"`
	WebhookSupport        bool `json:"webhook_support" gorm:"default:false"`
	ThirdPartyIntegration bool `json:"third_party_integration" gorm:"default:false"`
	CustomBranding        bool `json:"custom_branding" gorm:"default:false"`
	WhiteLabel            bool `json:"white_label" gorm:"default:false"`

	// Support Features
	PrioritySupport  bool `json:"priority_support" gorm:"default:false"`
	PhoneSupport     bool `json:"phone_support" gorm:"default:false"`
	DedicatedManager bool `json:"dedicated_manager" gorm:"default:false"`
	CustomTraining   bool `json:"custom_training" gorm:"default:false"`
}

// TrialConfig defines trial period configuration
type TrialConfig struct {
	TrialDays       int  `json:"trial_days" gorm:"default:14"`        // Trial period in days
	TrialEnabled    bool `json:"trial_enabled" gorm:"default:true"`   // Whether trial is enabled
	RequirePayment  bool `json:"require_payment" gorm:"default:false"` // Require payment info for trial
	AutoConvert     bool `json:"auto_convert" gorm:"default:false"`   // Auto convert to paid after trial
}

// DefaultStarterLimits returns default limits for starter plan
func DefaultStarterLimits() PlanLimits {
	return PlanLimits{
		MaxCustomers:       50,
		MaxUsers:           2,
		MaxDevices:         5,
		MaxBandwidth:       100,
		MaxStorage:         10,
		MaxHotspots:        2,
		MaxVLANs:           5,
		MaxFirewallRules:   20,
		MaxQueueRules:      10,
		MaxMonitoringDays:  30,
		MaxReports:         5,
		MaxAlerts:          10,
		MaxAPICallsPerHour: 100,
		MaxWebhooks:        2,
	}
}

// DefaultStarterFeatures returns default features for starter plan
func DefaultStarterFeatures() PlanFeatures {
	return PlanFeatures{
		CustomerManagement:    true,
		BillingManagement:     true,
		DeviceManagement:      true,
		NetworkMonitoring:     true,
		UserManagement:        true,
		MikrotikIntegration:   true,
		HotspotManagement:     false,
		VLANManagement:        false,
		FirewallManagement:    false,
		QueueManagement:       true,
		SpeedBoost:            false,
		RealTimeMonitoring:    false,
		AdvancedReports:       false,
		CustomDashboard:       false,
		DataExport:            false,
		AlertSystem:           true,
		APIAccess:             false,
		WebhookSupport:        false,
		ThirdPartyIntegration: false,
		CustomBranding:        false,
		WhiteLabel:            false,
		PrioritySupport:       false,
		PhoneSupport:          false,
		DedicatedManager:      false,
		CustomTraining:        false,
	}
}

// DefaultProfessionalLimits returns default limits for professional plan
func DefaultProfessionalLimits() PlanLimits {
	return PlanLimits{
		MaxCustomers:       200,
		MaxUsers:           5,
		MaxDevices:         20,
		MaxBandwidth:       500,
		MaxStorage:         50,
		MaxHotspots:        10,
		MaxVLANs:           20,
		MaxFirewallRules:   100,
		MaxQueueRules:      50,
		MaxMonitoringDays:  90,
		MaxReports:         20,
		MaxAlerts:          50,
		MaxAPICallsPerHour: 1000,
		MaxWebhooks:        10,
	}
}

// DefaultProfessionalFeatures returns default features for professional plan
func DefaultProfessionalFeatures() PlanFeatures {
	return PlanFeatures{
		CustomerManagement:    true,
		BillingManagement:     true,
		DeviceManagement:      true,
		NetworkMonitoring:     true,
		UserManagement:        true,
		MikrotikIntegration:   true,
		HotspotManagement:     true,
		VLANManagement:        true,
		FirewallManagement:    true,
		QueueManagement:       true,
		SpeedBoost:            true,
		RealTimeMonitoring:    true,
		AdvancedReports:       true,
		CustomDashboard:       true,
		DataExport:            true,
		AlertSystem:           true,
		APIAccess:             true,
		WebhookSupport:        true,
		ThirdPartyIntegration: false,
		CustomBranding:        true,
		WhiteLabel:            false,
		PrioritySupport:       true,
		PhoneSupport:          false,
		DedicatedManager:      false,
		CustomTraining:        false,
	}
}

// DefaultEnterpriseLimits returns default limits for enterprise plan (unlimited)
func DefaultEnterpriseLimits() PlanLimits {
	return PlanLimits{
		MaxCustomers:       -1, // unlimited
		MaxUsers:           -1,
		MaxDevices:         -1,
		MaxBandwidth:       -1,
		MaxStorage:         -1,
		MaxHotspots:        -1,
		MaxVLANs:           -1,
		MaxFirewallRules:   -1,
		MaxQueueRules:      -1,
		MaxMonitoringDays:  365,
		MaxReports:         -1,
		MaxAlerts:          -1,
		MaxAPICallsPerHour: -1,
		MaxWebhooks:        -1,
	}
}

// DefaultEnterpriseFeatures returns default features for enterprise plan (all enabled)
func DefaultEnterpriseFeatures() PlanFeatures {
	return PlanFeatures{
		CustomerManagement:    true,
		BillingManagement:     true,
		DeviceManagement:      true,
		NetworkMonitoring:     true,
		UserManagement:        true,
		MikrotikIntegration:   true,
		HotspotManagement:     true,
		VLANManagement:        true,
		FirewallManagement:    true,
		QueueManagement:       true,
		SpeedBoost:            true,
		RealTimeMonitoring:    true,
		AdvancedReports:       true,
		CustomDashboard:       true,
		DataExport:            true,
		AlertSystem:           true,
		APIAccess:             true,
		WebhookSupport:        true,
		ThirdPartyIntegration: true,
		CustomBranding:        true,
		WhiteLabel:            true,
		PrioritySupport:       true,
		PhoneSupport:          true,
		DedicatedManager:      true,
		CustomTraining:        true,
	}
}

// DefaultTrialLimits returns default limits for trial
func DefaultTrialLimits() PlanLimits {
	return PlanLimits{
		MaxCustomers:       25,
		MaxUsers:           1,
		MaxDevices:         3,
		MaxBandwidth:       50,
		MaxStorage:         5,
		MaxHotspots:        1,
		MaxVLANs:           2,
		MaxFirewallRules:   10,
		MaxQueueRules:      5,
		MaxMonitoringDays:  14,
		MaxReports:         2,
		MaxAlerts:          5,
		MaxAPICallsPerHour: 50,
		MaxWebhooks:        1,
	}
}

// DefaultTrialFeatures returns default features for trial
func DefaultTrialFeatures() PlanFeatures {
	return PlanFeatures{
		CustomerManagement:    true,
		BillingManagement:     true,
		DeviceManagement:      true,
		NetworkMonitoring:     true,
		UserManagement:        true,
		MikrotikIntegration:   true,
		HotspotManagement:     false,
		VLANManagement:        false,
		FirewallManagement:    false,
		QueueManagement:       true,
		SpeedBoost:            false,
		RealTimeMonitoring:    false,
		AdvancedReports:       false,
		CustomDashboard:       false,
		DataExport:            false,
		AlertSystem:           true,
		APIAccess:             false,
		WebhookSupport:        false,
		ThirdPartyIntegration: false,
		CustomBranding:        false,
		WhiteLabel:            false,
		PrioritySupport:       false,
		PhoneSupport:          false,
		DedicatedManager:      false,
		CustomTraining:        false,
	}
}
