package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	Redis      RedisConfig
	JWT        JWTConfig
	Encryption EncryptionConfig
	CORS       CORSConfig
	RateLimit  RateLimitConfig
	Email      EmailConfig
	RabbitMQ   RabbitMQConfig
	Backup     BackupConfig
	Midtrans   MidtransConfig
	R2Storage  R2StorageConfig
	VPN        VPNConfig
}

type ServerConfig struct {
	Port string
	Host string
	Mode string
}

type DatabaseConfig struct {
	Host           string
	Port           string
	User           string
	Password       string
	Name           string
	SSLMode        string
	MaxConnections int
	MaxIdle        int
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret              string
	AccessTokenExpiry   time.Duration
	RefreshTokenExpiry  time.Duration
}

type EncryptionConfig struct {
	Key string
}

type CORSConfig struct {
	AllowedOrigins []string
}

type RateLimitConfig struct {
	Global int
	User   int
	Login  int
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string
	SMTPFrom     string
}

type RabbitMQConfig struct {
	URL string
}

type BackupConfig struct {
	Path          string
	RetentionDays int
}

type MidtransConfig struct {
	ServerKey    string
	ClientKey    string
	IsProduction bool
}

type R2StorageConfig struct {
	AccountID       string
	AccessKeyID     string
	AccessKeySecret string
	BucketName      string
	PublicURL       string
}

type VPNConfig struct {
	ServerIP       string
	ServerPort     int
	RadiusInternalIP string
}

func Load() (*Config, error) {
	// Load .env file if exists
	_ = godotenv.Load()

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
			Mode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:           getEnv("DB_HOST", "localhost"),
			Port:           getEnv("DB_PORT", "5432"),
			User:           getEnv("DB_USER", "postgres"),
			Password:       getEnv("DB_PASSWORD", "postgres"),
			Name:           getEnv("DB_NAME", "rtrwnet_saas"),
			SSLMode:        getEnv("DB_SSLMODE", "disable"),
			MaxConnections: getEnvAsInt("DB_MAX_CONNECTIONS", 100),
			MaxIdle:        getEnvAsInt("DB_MAX_IDLE_CONNECTIONS", 10),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvAsInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:              getEnv("JWT_SECRET", "change-this-secret-key"),
			AccessTokenExpiry:   parseDuration(getEnv("JWT_ACCESS_TOKEN_EXPIRY", "15m")),
			RefreshTokenExpiry:  parseDuration(getEnv("JWT_REFRESH_TOKEN_EXPIRY", "168h")),
		},
		Encryption: EncryptionConfig{
			Key: getEnv("ENCRYPTION_KEY", "change-this-32-byte-key-please"),
		},
		CORS: CORSConfig{
			AllowedOrigins: parseStringSlice(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")),
		},
		RateLimit: RateLimitConfig{
			Global: getEnvAsInt("RATE_LIMIT_GLOBAL", 1000),
			User:   getEnvAsInt("RATE_LIMIT_USER", 100),
			Login:  getEnvAsInt("RATE_LIMIT_LOGIN", 5),
		},
		Email: EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", ""),
			SMTPPort:     getEnv("SMTP_PORT", "587"),
			SMTPUsername: getEnv("SMTP_USERNAME", ""),
			SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			SMTPFrom:     getEnv("SMTP_FROM", "noreply@rtrwnet.com"),
		},
		RabbitMQ: RabbitMQConfig{
			URL: getEnv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/"),
		},
		Backup: BackupConfig{
			Path:          getEnv("BACKUP_PATH", "./backups"),
			RetentionDays: getEnvAsInt("BACKUP_RETENTION_DAYS", 30),
		},
		Midtrans: MidtransConfig{
			ServerKey:    getEnv("MIDTRANS_SERVER_KEY", ""),
			ClientKey:    getEnv("MIDTRANS_CLIENT_KEY", ""),
			IsProduction: getEnv("MIDTRANS_IS_PRODUCTION", "false") == "true",
		},
		R2Storage: R2StorageConfig{
			AccountID:       getEnv("R2_ACCOUNT_ID", ""),
			AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
			AccessKeySecret: getEnv("R2_ACCESS_KEY_SECRET", ""),
			BucketName:      getEnv("R2_BUCKET_NAME", ""),
			PublicURL:       getEnv("R2_PUBLIC_URL", ""),
		},
		VPN: VPNConfig{
			ServerIP:         getEnv("VPN_SERVER_IP", ""),
			ServerPort:       getEnvAsInt("VPN_SERVER_PORT", 1194),
			RadiusInternalIP: getEnv("RADIUS_INTERNAL_IP", "10.8.0.1"),
		},
	}

	return cfg, nil
}

func (c *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.Name, c.SSLMode,
	)
}

func (c *RedisConfig) Address() string {
	return fmt.Sprintf("%s:%s", c.Host, c.Port)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 15 * time.Minute
	}
	return d
}

func parseStringSlice(s string) []string {
	if s == "" {
		return []string{}
	}
	
	// Split by comma and trim spaces
	parts := []string{}
	for _, part := range splitString(s, ",") {
		trimmed := trimSpace(part)
		if trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

func splitString(s, sep string) []string {
	result := []string{}
	current := ""
	
	for _, char := range s {
		if string(char) == sep {
			result = append(result, current)
			current = ""
		} else {
			current += string(char)
		}
	}
	
	if current != "" {
		result = append(result, current)
	}
	
	return result
}

func trimSpace(s string) string {
	start := 0
	end := len(s)
	
	// Trim leading spaces
	for start < end && (s[start] == ' ' || s[start] == '\t' || s[start] == '\n' || s[start] == '\r') {
		start++
	}
	
	// Trim trailing spaces
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t' || s[end-1] == '\n' || s[end-1] == '\r') {
		end--
	}
	
	return s[start:end]
}
