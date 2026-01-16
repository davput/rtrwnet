package errors

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
	Status  int         `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

func New(code, message string, status int) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  status,
	}
}

func NewWithDetails(code, message string, status int, details interface{}) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Status:  status,
		Details: details,
	}
}

// Predefined errors with detailed codes
var (
	// Authentication errors
	ErrUnauthorized       = &AppError{Code: "AUTH_1002", Message: "Unauthorized access", Status: http.StatusUnauthorized}
	ErrInvalidCredentials = &AppError{Code: "AUTH_1001", Message: "Invalid email or password", Status: http.StatusUnauthorized}
	ErrTokenExpired       = &AppError{Code: "AUTH_1003", Message: "Token has expired", Status: http.StatusUnauthorized}
	ErrTokenInvalid       = &AppError{Code: "AUTH_1004", Message: "Invalid token", Status: http.StatusUnauthorized}
	ErrUserInactive       = &AppError{Code: "AUTH_1005", Message: "User account is inactive", Status: http.StatusForbidden}
	
	// Validation errors
	ErrValidation         = &AppError{Code: "VAL_2001", Message: "Validation failed", Status: http.StatusBadRequest}
	ErrBadRequest         = &AppError{Code: "VAL_2006", Message: "Invalid request data", Status: http.StatusBadRequest}
	ErrInvalidJSON        = &AppError{Code: "VAL_2002", Message: "Invalid JSON format", Status: http.StatusBadRequest}
	ErrMissingField       = &AppError{Code: "VAL_2003", Message: "Required field is missing", Status: http.StatusBadRequest}
	ErrInvalidFieldValue  = &AppError{Code: "VAL_2004", Message: "Invalid field value", Status: http.StatusBadRequest}
	ErrInvalidQueryParam  = &AppError{Code: "VAL_2005", Message: "Invalid query parameter", Status: http.StatusBadRequest}
	
	// Resource errors
	ErrNotFound           = &AppError{Code: "RES_6001", Message: "Resource not found", Status: http.StatusNotFound}
	ErrDuplicateEntry     = &AppError{Code: "RES_6002", Message: "Resource already exists", Status: http.StatusConflict}
	ErrConflict           = &AppError{Code: "RES_6003", Message: "Resource conflict", Status: http.StatusConflict}
	
	// Customer errors
	ErrCustomerNotFound      = &AppError{Code: "CUST_5001", Message: "Customer not found", Status: http.StatusNotFound}
	ErrCustomerCodeExists    = &AppError{Code: "CUST_5002", Message: "Customer code already exists", Status: http.StatusConflict}
	ErrCustomerPhoneExists   = &AppError{Code: "CUST_5003", Message: "Phone number already registered", Status: http.StatusConflict}
	ErrCustomerEmailExists   = &AppError{Code: "CUST_5004", Message: "Email already registered", Status: http.StatusConflict}
	ErrCustomerHasPayments   = &AppError{Code: "CUST_5005", Message: "Cannot delete customer with payment history", Status: http.StatusConflict}
	ErrInvalidCustomerStatus = &AppError{Code: "CUST_5006", Message: "Invalid customer status", Status: http.StatusBadRequest}
	
	// Service Plan errors
	ErrServicePlanNotFound   = &AppError{Code: "PLAN_7001", Message: "Service plan not found", Status: http.StatusNotFound}
	ErrServicePlanInUse      = &AppError{Code: "PLAN_7002", Message: "Service plan is in use by customers", Status: http.StatusConflict}
	ErrServicePlanNameExists = &AppError{Code: "PLAN_7003", Message: "Service plan name already exists", Status: http.StatusConflict}
	
	// Payment errors
	ErrPaymentNotFound       = &AppError{Code: "PAY_8001", Message: "Payment not found", Status: http.StatusNotFound}
	ErrPaymentAlreadyPaid    = &AppError{Code: "PAY_8002", Message: "Payment already marked as paid", Status: http.StatusConflict}
	ErrInvalidPaymentAmount  = &AppError{Code: "PAY_8003", Message: "Invalid payment amount", Status: http.StatusBadRequest}
	ErrInvalidPaymentMethod  = &AppError{Code: "PAY_8004", Message: "Invalid payment method", Status: http.StatusBadRequest}
	
	// Tenant errors
	ErrTenantNotFound     = &AppError{Code: "TENANT_3001", Message: "Tenant not found", Status: http.StatusNotFound}
	ErrTenantInactive     = &AppError{Code: "TENANT_3002", Message: "Tenant is inactive", Status: http.StatusForbidden}
	ErrSubdomainTaken     = &AppError{Code: "TENANT_3004", Message: "Subdomain is already taken", Status: http.StatusConflict}
	
	// Subscription errors
	ErrSubscriptionNotFound  = &AppError{Code: "SUB_4001", Message: "Subscription not found", Status: http.StatusNotFound}
	ErrSubscriptionExpired   = &AppError{Code: "SUB_4002", Message: "Subscription has expired", Status: http.StatusForbidden}
	ErrSubscriptionRequired  = &AppError{Code: "SUB_4003", Message: "Active subscription required", Status: http.StatusForbidden}
	ErrInvalidPlan           = &AppError{Code: "SUB_4004", Message: "Invalid subscription plan", Status: http.StatusBadRequest}
	ErrTrialExpired          = &AppError{Code: "SUB_4005", Message: "Trial period has expired. Please upgrade to continue.", Status: http.StatusForbidden}
	ErrCustomerLimitReached  = &AppError{Code: "PLAN_4001", Message: "Customer limit reached for your plan", Status: http.StatusForbidden}
	ErrUserLimitReached      = &AppError{Code: "PLAN_4002", Message: "User limit reached for your plan", Status: http.StatusForbidden}
	ErrFeatureNotAvailable   = &AppError{Code: "PLAN_4003", Message: "Feature not available in your plan", Status: http.StatusForbidden}
	
	// Server errors
	ErrInternalServer     = &AppError{Code: "SRV_9001", Message: "Internal server error", Status: http.StatusInternalServerError}
	ErrDatabaseError      = &AppError{Code: "SRV_9002", Message: "Database error", Status: http.StatusInternalServerError}
	ErrRateLimitExceeded  = &AppError{Code: "RATE_LIMIT", Message: "Rate limit exceeded", Status: http.StatusTooManyRequests}
	ErrForbidden          = &AppError{Code: "FORBIDDEN", Message: "Forbidden", Status: http.StatusForbidden}
)

// Helper functions for creating common errors
func NewNotFoundError(message string) *AppError {
	return &AppError{
		Code:    "RES_6001",
		Message: message,
		Status:  http.StatusNotFound,
	}
}

func NewValidationError(message string) *AppError {
	return &AppError{
		Code:    "VAL_2001",
		Message: message,
		Status:  http.StatusBadRequest,
	}
}

func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Code:    "AUTH_1002",
		Message: message,
		Status:  http.StatusUnauthorized,
	}
}

func NewConflictError(message string) *AppError {
	return &AppError{
		Code:    "RES_6003",
		Message: message,
		Status:  http.StatusConflict,
	}
}

func NewInternalError(message string) *AppError {
	return &AppError{
		Code:    "SRV_9001",
		Message: message,
		Status:  http.StatusInternalServerError,
	}
}

func NewForbiddenError(message string) *AppError {
	return &AppError{
		Code:    "FORBIDDEN",
		Message: message,
		Status:  http.StatusForbidden,
	}
}

// NewValidationErrorWithDetails creates a validation error with field details
func NewValidationErrorWithDetails(message string, details interface{}) *AppError {
	return &AppError{
		Code:    "VAL_2001",
		Message: message,
		Status:  http.StatusBadRequest,
		Details: details,
	}
}

// NewCustomerNotFoundError creates a customer not found error
func NewCustomerNotFoundError(customerID string) *AppError {
	return &AppError{
		Code:    "CUST_5001",
		Message: "Customer not found",
		Status:  http.StatusNotFound,
		Details: map[string]interface{}{"customer_id": customerID},
	}
}

// NewServicePlanNotFoundError creates a service plan not found error
func NewServicePlanNotFoundError(planID string) *AppError {
	return &AppError{
		Code:    "PLAN_7001",
		Message: "Service plan not found",
		Status:  http.StatusNotFound,
		Details: map[string]interface{}{"plan_id": planID},
	}
}

// NewPaymentNotFoundError creates a payment not found error
func NewPaymentNotFoundError(paymentID string) *AppError {
	return &AppError{
		Code:    "PAY_8001",
		Message: "Payment not found",
		Status:  http.StatusNotFound,
		Details: map[string]interface{}{"payment_id": paymentID},
	}
}

// NewDuplicateError creates a duplicate entry error with field info
func NewDuplicateError(field, value string) *AppError {
	return &AppError{
		Code:    "RES_6002",
		Message: fmt.Sprintf("%s already exists", field),
		Status:  http.StatusConflict,
		Details: map[string]interface{}{"field": field, "value": value},
	}
}

// NewDatabaseError creates a database error with context
func NewDatabaseError(operation string, err error) *AppError {
	return &AppError{
		Code:    "SRV_9002",
		Message: "Database operation failed",
		Status:  http.StatusInternalServerError,
		Details: map[string]interface{}{"operation": operation, "error": err.Error()},
	}
}
