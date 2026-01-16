package errors

// Error codes for better error handling
const (
	// Authentication errors (1xxx)
	ErrCodeInvalidCredentials    = "AUTH_1001"
	ErrCodeUnauthorized          = "AUTH_1002"
	ErrCodeTokenExpired          = "AUTH_1003"
	ErrCodeTokenInvalid          = "AUTH_1004"
	ErrCodeUserInactive          = "AUTH_1005"
	ErrCodeUserNotFound          = "AUTH_1006"
	
	// Validation errors (2xxx)
	ErrCodeValidationFailed      = "VAL_2001"
	ErrCodeInvalidEmail          = "VAL_2002"
	ErrCodeInvalidPhone          = "VAL_2003"
	ErrCodeInvalidSubdomain      = "VAL_2004"
	ErrCodeWeakPassword          = "VAL_2005"
	ErrCodeInvalidInput          = "VAL_2006"
	
	// Tenant errors (3xxx)
	ErrCodeTenantNotFound        = "TENANT_3001"
	ErrCodeTenantInactive        = "TENANT_3002"
	ErrCodeTenantExists          = "TENANT_3003"
	ErrCodeSubdomainTaken        = "TENANT_3004"
	
	// Subscription errors (4xxx)
	ErrCodeSubscriptionNotFound  = "SUB_4001"
	ErrCodeSubscriptionExpired   = "SUB_4002"
	ErrCodeSubscriptionCancelled = "SUB_4003"
	ErrCodeInvalidPlan           = "SUB_4004"
	ErrCodeTrialAlreadyUsed      = "SUB_4005"
	
	// Payment errors (5xxx)
	ErrCodePaymentFailed         = "PAY_5001"
	ErrCodePaymentPending        = "PAY_5002"
	ErrCodeInvalidPaymentMethod  = "PAY_5003"
	
	// Resource errors (6xxx)
	ErrCodeNotFound              = "RES_6001"
	ErrCodeAlreadyExists         = "RES_6002"
	ErrCodeConflict              = "RES_6003"
	
	// Server errors (9xxx)
	ErrCodeInternalServer        = "SRV_9001"
	ErrCodeDatabaseError         = "SRV_9002"
	ErrCodeCacheError            = "SRV_9003"
)

// Error messages
var ErrorMessages = map[string]string{
	// Authentication
	ErrCodeInvalidCredentials:    "Invalid email or password",
	ErrCodeUnauthorized:          "Unauthorized access",
	ErrCodeTokenExpired:          "Token has expired",
	ErrCodeTokenInvalid:          "Invalid token",
	ErrCodeUserInactive:          "User account is inactive",
	ErrCodeUserNotFound:          "User not found",
	
	// Validation
	ErrCodeValidationFailed:      "Validation failed",
	ErrCodeInvalidEmail:          "Invalid email format",
	ErrCodeInvalidPhone:          "Invalid phone number format",
	ErrCodeInvalidSubdomain:      "Invalid subdomain format",
	ErrCodeWeakPassword:          "Password is too weak",
	ErrCodeInvalidInput:          "Invalid input data",
	
	// Tenant
	ErrCodeTenantNotFound:        "Tenant not found",
	ErrCodeTenantInactive:        "Tenant is inactive",
	ErrCodeTenantExists:          "Tenant already exists",
	ErrCodeSubdomainTaken:        "Subdomain is already taken",
	
	// Subscription
	ErrCodeSubscriptionNotFound:  "Subscription not found",
	ErrCodeSubscriptionExpired:   "Subscription has expired",
	ErrCodeSubscriptionCancelled: "Subscription has been cancelled",
	ErrCodeInvalidPlan:           "Invalid subscription plan",
	ErrCodeTrialAlreadyUsed:      "Trial has already been used",
	
	// Payment
	ErrCodePaymentFailed:         "Payment failed",
	ErrCodePaymentPending:        "Payment is pending",
	ErrCodeInvalidPaymentMethod:  "Invalid payment method",
	
	// Resource
	ErrCodeNotFound:              "Resource not found",
	ErrCodeAlreadyExists:         "Resource already exists",
	ErrCodeConflict:              "Resource conflict",
	
	// Server
	ErrCodeInternalServer:        "Internal server error",
	ErrCodeDatabaseError:         "Database error",
	ErrCodeCacheError:            "Cache error",
}

// GetErrorMessage returns the error message for a given error code
func GetErrorMessage(code string) string {
	if msg, ok := ErrorMessages[code]; ok {
		return msg
	}
	return "Unknown error"
}
