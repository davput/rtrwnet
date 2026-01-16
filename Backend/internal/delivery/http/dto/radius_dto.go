package dto

import "time"

// ==================== NAS DTOs ====================

type CreateNASRequest struct {
	NASName     string `json:"nasname" binding:"required"`
	ShortName   string `json:"shortname" binding:"required"`
	Type        string `json:"type"`
	Ports       int    `json:"ports"`
	Secret      string `json:"secret" binding:"required"`
	Server      string `json:"server"`
	Community   string `json:"community"`
	Description string `json:"description"`
}

type UpdateNASRequest struct {
	NASName     string `json:"nasname"`
	ShortName   string `json:"shortname"`
	Type        string `json:"type"`
	Ports       int    `json:"ports"`
	Secret      string `json:"secret"`
	Server      string `json:"server"`
	Community   string `json:"community"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

type NASResponse struct {
	ID          string    `json:"id"`
	NASName     string    `json:"nasname"`
	ShortName   string    `json:"shortname"`
	Type        string    `json:"type"`
	Ports       int       `json:"ports"`
	Server      string    `json:"server"`
	Community   string    `json:"community"`
	Description string    `json:"description"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ==================== RADIUS User DTOs ====================

type CreateRadiusUserRequest struct {
	CustomerID      string `json:"customer_id"`
	Username        string `json:"username" binding:"required"`
	Password        string `json:"password" binding:"required"`
	AuthType        string `json:"auth_type"`
	ProfileName     string `json:"profile_name"`
	IPAddress       string `json:"ip_address"`
	MACAddress      string `json:"mac_address"`
	SimultaneousUse int    `json:"simultaneous_use"`
	ExpireDays      int    `json:"expire_days"`
}


type UpdateRadiusUserRequest struct {
	Password        string `json:"password"`
	AuthType        string `json:"auth_type"`
	ProfileName     string `json:"profile_name"`
	IPAddress       string `json:"ip_address"`
	MACAddress      string `json:"mac_address"`
	SimultaneousUse int    `json:"simultaneous_use"`
	ExpireDays      int    `json:"expire_days"`
	IsActive        *bool  `json:"is_active"`
}

type RadiusUserResponse struct {
	ID              string                    `json:"id"`
	CustomerID      *string                   `json:"customer_id"`
	CustomerName    string                    `json:"customer_name,omitempty"`
	Username        string                    `json:"username"`
	AuthType        string                    `json:"auth_type"`
	ProfileName     string                    `json:"profile_name"`
	IPAddress       string                    `json:"ip_address"`
	MACAddress      string                    `json:"mac_address"`
	IsActive        bool                      `json:"is_active"`
	SimultaneousUse int                       `json:"simultaneous_use"`
	ExpireDate      *time.Time                `json:"expire_date"`
	Attributes      []RadiusAttributeResponse `json:"attributes,omitempty"`
	CreatedAt       time.Time                 `json:"created_at"`
	UpdatedAt       time.Time                 `json:"updated_at"`
}

type RadiusAttributeResponse struct {
	ID        string `json:"id"`
	Attribute string `json:"attribute"`
	Op        string `json:"op"`
	Value     string `json:"value"`
	AttrType  string `json:"attr_type"`
}

// ==================== Profile DTOs ====================

type CreateRadiusProfileRequest struct {
	ServicePlanID    string `json:"service_plan_id"`
	Name             string `json:"name" binding:"required"`
	Description      string `json:"description"`
	RateLimitRx      int    `json:"rate_limit_rx"`
	RateLimitTx      int    `json:"rate_limit_tx"`
	BurstLimitRx     int    `json:"burst_limit_rx"`
	BurstLimitTx     int    `json:"burst_limit_tx"`
	BurstThresholdRx int    `json:"burst_threshold_rx"`
	BurstThresholdTx int    `json:"burst_threshold_tx"`
	BurstTime        int    `json:"burst_time"`
	SessionTimeout   int    `json:"session_timeout"`
	IdleTimeout      int    `json:"idle_timeout"`
	IPPool           string `json:"ip_pool"`
}

type UpdateRadiusProfileRequest struct {
	Name             string `json:"name"`
	Description      string `json:"description"`
	RateLimitRx      int    `json:"rate_limit_rx"`
	RateLimitTx      int    `json:"rate_limit_tx"`
	BurstLimitRx     int    `json:"burst_limit_rx"`
	BurstLimitTx     int    `json:"burst_limit_tx"`
	BurstThresholdRx int    `json:"burst_threshold_rx"`
	BurstThresholdTx int    `json:"burst_threshold_tx"`
	BurstTime        int    `json:"burst_time"`
	SessionTimeout   int    `json:"session_timeout"`
	IdleTimeout      int    `json:"idle_timeout"`
	IPPool           string `json:"ip_pool"`
	IsActive         *bool  `json:"is_active"`
}

type ProfileResponse struct {
	ID               string  `json:"id"`
	ServicePlanID    *string `json:"service_plan_id"`
	ServicePlanName  string  `json:"service_plan_name,omitempty"`
	Name             string  `json:"name"`
	Description      string  `json:"description"`
	RateLimitRx      int     `json:"rate_limit_rx"`
	RateLimitTx      int     `json:"rate_limit_tx"`
	BurstLimitRx     int     `json:"burst_limit_rx"`
	BurstLimitTx     int     `json:"burst_limit_tx"`
	BurstThresholdRx int     `json:"burst_threshold_rx"`
	BurstThresholdTx int     `json:"burst_threshold_tx"`
	BurstTime        int     `json:"burst_time"`
	SessionTimeout   int     `json:"session_timeout"`
	IdleTimeout      int     `json:"idle_timeout"`
	IPPool           string  `json:"ip_pool"`
	IsActive         bool    `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// ==================== Accounting DTOs ====================

type AccountingResponse struct {
	ID                string     `json:"id"`
	Username          string     `json:"username"`
	NASIPAddress      string     `json:"nas_ip_address"`
	AcctSessionID     string     `json:"acct_session_id"`
	AcctStartTime     *time.Time `json:"acct_start_time"`
	AcctStopTime      *time.Time `json:"acct_stop_time"`
	AcctSessionTime   int        `json:"acct_session_time"`
	AcctInputOctets   int64      `json:"acct_input_octets"`
	AcctOutputOctets  int64      `json:"acct_output_octets"`
	FramedIPAddress   string     `json:"framed_ip_address"`
	CallingStationID  string     `json:"calling_station_id"`
	AcctTerminateCause string    `json:"acct_terminate_cause"`
}

type UsageStatsResponse struct {
	TotalSessions    int     `json:"total_sessions"`
	TotalUpload      int64   `json:"total_upload"`
	TotalDownload    int64   `json:"total_download"`
	TotalSessionTime int     `json:"total_session_time"`
	AvgSessionTime   float64 `json:"avg_session_time"`
}
