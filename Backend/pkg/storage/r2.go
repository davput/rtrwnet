package storage

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	pkgconfig "github.com/rtrwnet/saas-backend/pkg/config"
)

// R2Client wraps the S3 client for Cloudflare R2
type R2Client struct {
	client     *s3.Client
	bucketName string
	publicURL  string
}

// NewR2Client creates a new R2 storage client
func NewR2Client(cfg *pkgconfig.R2StorageConfig) (*R2Client, error) {
	if cfg.AccountID == "" || cfg.AccessKeyID == "" || cfg.AccessKeySecret == "" {
		return nil, fmt.Errorf("R2 storage not configured")
	}

	// R2 endpoint format
	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)

	// Create custom resolver for R2
	r2Resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: endpoint,
		}, nil
	})

	// Load AWS config with R2 credentials
	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithEndpointResolverWithOptions(r2Resolver),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID,
			cfg.AccessKeySecret,
			"",
		)),
		config.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load R2 config: %w", err)
	}

	client := s3.NewFromConfig(awsCfg)

	return &R2Client{
		client:     client,
		bucketName: cfg.BucketName,
		publicURL:  cfg.PublicURL,
	}, nil
}

// UploadFile uploads a file to R2 and returns the public URL
func (r *R2Client) UploadFile(ctx context.Context, file io.Reader, filename string, contentType string, folder string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(filename)
	uniqueName := fmt.Sprintf("%s/%s%s", folder, uuid.New().String(), ext)

	// Upload to R2
	_, err := r.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(r.bucketName),
		Key:         aws.String(uniqueName),
		Body:        file,
		ContentType: aws.String(contentType),
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	// Return public URL
	publicURL := fmt.Sprintf("%s/%s", strings.TrimSuffix(r.publicURL, "/"), uniqueName)
	return publicURL, nil
}

// DeleteFile deletes a file from R2
func (r *R2Client) DeleteFile(ctx context.Context, fileURL string) error {
	// Extract key from URL
	key := strings.TrimPrefix(fileURL, r.publicURL+"/")
	if key == fileURL {
		// URL doesn't match public URL pattern, try to extract key differently
		parts := strings.Split(fileURL, "/")
		if len(parts) >= 2 {
			key = strings.Join(parts[len(parts)-2:], "/")
		}
	}

	_, err := r.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// GetPresignedURL generates a presigned URL for temporary access
func (r *R2Client) GetPresignedURL(ctx context.Context, key string, expiry time.Duration) (string, error) {
	presignClient := s3.NewPresignClient(r.client)

	request, err := presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(r.bucketName),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(expiry))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return request.URL, nil
}

// IsConfigured returns true if R2 is properly configured
func (r *R2Client) IsConfigured() bool {
	return r != nil && r.client != nil
}

// AllowedImageTypes returns allowed image MIME types
func AllowedImageTypes() map[string]bool {
	return map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}
}

// MaxFileSize returns max file size in bytes (5MB)
func MaxFileSize() int64 {
	return 5 * 1024 * 1024
}
