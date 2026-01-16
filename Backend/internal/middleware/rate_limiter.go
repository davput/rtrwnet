package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

// RateLimiterConfig holds rate limiter configuration
type RateLimiterConfig struct {
	MaxRequests int           // Maximum requests allowed
	Window      time.Duration // Time window
	RedisClient *redis.Client // Redis client
}

// RateLimiter middleware limits requests per user
type RateLimiter struct {
	config *RateLimiterConfig
}

// NewRateLimiter creates a new rate limiter middleware
func NewRateLimiter(config *RateLimiterConfig) *RateLimiter {
	return &RateLimiter{
		config: config,
	}
}

// Limit returns a middleware that limits requests per user
func (rl *RateLimiter) Limit() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip if Redis is not available
		if rl.config.RedisClient == nil {
			logger.Debug("Rate limiter skipped: Redis not available")
			c.Next()
			return
		}

		// Get user identifier (IP address or user ID if authenticated)
		identifier := rl.getUserIdentifier(c)

		// Check rate limit
		allowed, remaining, resetTime, err := rl.checkRateLimit(c.Request.Context(), identifier)
		if err != nil {
			logger.Error("Rate limiter error: %v", err)
			// Continue on error (fail open)
			c.Next()
			return
		}

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", rl.config.MaxRequests))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", resetTime.Unix()))

		if !allowed {
			logger.Info("Rate limit exceeded for: %s", identifier)
			response.Error(c, 429, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", map[string]interface{}{
				"retry_after": resetTime.Unix(),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// getUserIdentifier gets unique identifier for the user
func (rl *RateLimiter) getUserIdentifier(c *gin.Context) string {
	// Try to get user ID from context (if authenticated)
	if userID, exists := c.Get("user_id"); exists {
		if id, ok := userID.(string); ok {
			return fmt.Sprintf("user:%s", id)
		}
	}

	// Fallback to IP address
	clientIP := c.ClientIP()
	return fmt.Sprintf("ip:%s", clientIP)
}

// checkRateLimit checks if request is allowed based on rate limit
func (rl *RateLimiter) checkRateLimit(ctx context.Context, identifier string) (allowed bool, remaining int, resetTime time.Time, err error) {
	key := fmt.Sprintf("rate_limit:%s", identifier)
	now := time.Now()
	windowStart := now.Truncate(rl.config.Window)
	resetTime = windowStart.Add(rl.config.Window)

	// Use Redis pipeline for atomic operations
	pipe := rl.config.RedisClient.Pipeline()

	// Increment counter
	incrCmd := pipe.Incr(ctx, key)

	// Set expiry if key is new
	pipe.ExpireAt(ctx, key, resetTime)

	// Execute pipeline
	_, err = pipe.Exec(ctx)
	if err != nil {
		return false, 0, resetTime, err
	}

	// Get current count
	count := incrCmd.Val()

	// Check if limit exceeded
	if count > int64(rl.config.MaxRequests) {
		return false, 0, resetTime, nil
	}

	remaining = rl.config.MaxRequests - int(count)
	return true, remaining, resetTime, nil
}

// PerUserRateLimiter creates a rate limiter for authenticated users
func PerUserRateLimiter(redisClient *redis.Client, maxRequests int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(&RateLimiterConfig{
		MaxRequests: maxRequests,
		Window:      window,
		RedisClient: redisClient,
	})
	return limiter.Limit()
}

// PerIPRateLimiter creates a rate limiter based on IP address
func PerIPRateLimiter(redisClient *redis.Client, maxRequests int, window time.Duration) gin.HandlerFunc {
	limiter := NewRateLimiter(&RateLimiterConfig{
		MaxRequests: maxRequests,
		Window:      window,
		RedisClient: redisClient,
	})
	return limiter.Limit()
}
