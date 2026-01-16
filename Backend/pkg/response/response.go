package response

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/pkg/errors"
)

// StandardResponse represents the standard API response format
type StandardResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// SuccessResponse is an alias for StandardResponse (for Swagger documentation)
type SuccessResponse = StandardResponse

// ErrorResponse is an alias for StandardResponse (for Swagger documentation)
type ErrorResponse = StandardResponse

// ErrorInfo represents error information in the response
type ErrorInfo struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// Meta represents metadata for pagination, etc.
type Meta struct {
	Page       int `json:"page,omitempty"`
	PerPage    int `json:"per_page,omitempty"`
	Total      int `json:"total,omitempty"`
	TotalPages int `json:"total_pages,omitempty"`
}

// Success sends a successful response
func Success(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, StandardResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// SuccessWithMeta sends a successful response with metadata
func SuccessWithMeta(c *gin.Context, statusCode int, message string, data interface{}, meta *Meta) {
	c.JSON(statusCode, StandardResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

// Error sends an error response
func Error(c *gin.Context, statusCode int, code string, message string, details map[string]interface{}) {
	c.JSON(statusCode, StandardResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    code,
			Message: message,
			Details: details,
		},
	})
}

// ErrorFromAppError sends an error response from AppError
func ErrorFromAppError(c *gin.Context, err *errors.AppError) {
	details := make(map[string]interface{})
	if err.Details != nil {
		if detailsMap, ok := err.Details.(map[string]interface{}); ok {
			details = detailsMap
		} else if detailsStr, ok := err.Details.(string); ok {
			details["message"] = detailsStr
		} else {
			details["details"] = err.Details
		}
	}

	c.JSON(err.Status, StandardResponse{
		Success: false,
		Error: &ErrorInfo{
			Code:    err.Code,
			Message: err.Message,
			Details: details,
		},
	})
}

// Created sends a 201 Created response
func Created(c *gin.Context, message string, data interface{}) {
	Success(c, 201, message, data)
}

// OK sends a 200 OK response
func OK(c *gin.Context, message string, data interface{}) {
	Success(c, 200, message, data)
}

// NoContent sends a 204 No Content response
func NoContent(c *gin.Context) {
	c.Status(204)
}

// BadRequest sends a 400 Bad Request response
func BadRequest(c *gin.Context, code string, message string, details map[string]interface{}) {
	Error(c, 400, code, message, details)
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(c *gin.Context, code string, message string) {
	Error(c, 401, code, message, nil)
}

// Forbidden sends a 403 Forbidden response
func Forbidden(c *gin.Context, code string, message string) {
	Error(c, 403, code, message, nil)
}

// NotFound sends a 404 Not Found response
func NotFound(c *gin.Context, code string, message string) {
	Error(c, 404, code, message, nil)
}

// Conflict sends a 409 Conflict response
func Conflict(c *gin.Context, code string, message string, details map[string]interface{}) {
	Error(c, 409, code, message, details)
}

// InternalServerError sends a 500 Internal Server Error response
func InternalServerError(c *gin.Context, code string, message string) {
	Error(c, 500, code, message, nil)
}


// SimpleError sends a simple error response with just message
func SimpleError(c *gin.Context, statusCode int, message string, errMsg string) {
	details := make(map[string]interface{})
	if errMsg != "" {
		details["error"] = errMsg
	}
	
	code := "ERROR"
	switch statusCode {
	case 400:
		code = "BAD_REQUEST"
	case 401:
		code = "UNAUTHORIZED"
	case 403:
		code = "FORBIDDEN"
	case 404:
		code = "NOT_FOUND"
	case 409:
		code = "CONFLICT"
	case 500:
		code = "INTERNAL_ERROR"
	}
	
	Error(c, statusCode, code, message, details)
}
