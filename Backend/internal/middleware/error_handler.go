package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
)

// ErrorHandler middleware handles errors from handlers
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err

			if appErr, ok := err.(*errors.AppError); ok {
				c.JSON(appErr.Status, appErr)
				return
			}

			// Log unexpected errors
			logger.Error("Unexpected error: %v", err)
			c.JSON(500, errors.ErrInternalServer)
		}
	}
}
