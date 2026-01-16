package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/logger"
	"gorm.io/gorm"
)

// NotificationService defines the interface for notification operations
type NotificationService interface {
	// User notifications
	CreateNotification(ctx context.Context, notification *entity.Notification) error
	GetNotifications(ctx context.Context, tenantID string, userID *string, page, perPage int, unreadOnly bool) ([]*entity.Notification, int64, error)
	GetUnreadCount(ctx context.Context, tenantID string, userID *string) (int64, error)
	MarkAsRead(ctx context.Context, tenantID, notificationID string) error
	MarkAllAsRead(ctx context.Context, tenantID string, userID *string) error
	DeleteNotification(ctx context.Context, tenantID, notificationID string) error

	// Admin notifications
	CreateAdminNotification(ctx context.Context, notification *entity.AdminNotification) error
	GetAdminNotifications(ctx context.Context, adminID *string, page, perPage int, unreadOnly bool) ([]*entity.AdminNotification, int64, error)
	GetAdminUnreadCount(ctx context.Context, adminID *string) (int64, error)
	MarkAdminAsRead(ctx context.Context, notificationID string) error
	MarkAllAdminAsRead(ctx context.Context, adminID *string) error
	DeleteAdminNotification(ctx context.Context, notificationID string) error

	// Real-time via Redis
	PublishNotification(ctx context.Context, channel string, notification interface{}) error
	SubscribeNotifications(ctx context.Context, channel string) (<-chan *redis.Message, func())
}

type notificationService struct {
	db    *gorm.DB
	redis *redis.Client
}

// NewNotificationService creates a new notification service
func NewNotificationService(db *gorm.DB, redisClient *redis.Client) NotificationService {
	return &notificationService{
		db:    db,
		redis: redisClient,
	}
}

// Redis channel prefixes
const (
	UserNotificationChannel  = "notifications:user:"
	TenantNotificationChannel = "notifications:tenant:"
	AdminNotificationChannel = "notifications:admin:"
	GlobalAdminChannel       = "notifications:admin:global"
)

// CreateNotification creates a new notification and publishes to Redis
func (s *notificationService) CreateNotification(ctx context.Context, notification *entity.Notification) error {
	if err := s.db.WithContext(ctx).Create(notification).Error; err != nil {
		return errors.NewInternalError("Failed to create notification")
	}

	// Publish to Redis for real-time delivery
	channel := TenantNotificationChannel + notification.TenantID
	if notification.UserID != nil {
		channel = UserNotificationChannel + *notification.UserID
	}
	s.PublishNotification(ctx, channel, notification)

	return nil
}

// GetNotifications retrieves notifications for a tenant/user
func (s *notificationService) GetNotifications(ctx context.Context, tenantID string, userID *string, page, perPage int, unreadOnly bool) ([]*entity.Notification, int64, error) {
	var notifications []*entity.Notification
	var total int64

	offset := (page - 1) * perPage
	query := s.db.WithContext(ctx).Model(&entity.Notification{}).Where("tenant_id = ?", tenantID)

	if userID != nil {
		query = query.Where("user_id = ? OR user_id IS NULL", *userID)
	}

	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

// GetUnreadCount returns the count of unread notifications
func (s *notificationService) GetUnreadCount(ctx context.Context, tenantID string, userID *string) (int64, error) {
	var count int64
	query := s.db.WithContext(ctx).Model(&entity.Notification{}).Where("tenant_id = ? AND is_read = ?", tenantID, false)

	if userID != nil {
		query = query.Where("user_id = ? OR user_id IS NULL", *userID)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

// MarkAsRead marks a notification as read
func (s *notificationService) MarkAsRead(ctx context.Context, tenantID, notificationID string) error {
	now := time.Now()
	result := s.db.WithContext(ctx).Model(&entity.Notification{}).
		Where("id = ? AND tenant_id = ?", notificationID, tenantID).
		Updates(map[string]interface{}{"is_read": true, "read_at": now})

	if result.Error != nil {
		return errors.NewInternalError("Failed to mark notification as read")
	}
	if result.RowsAffected == 0 {
		return errors.NewNotFoundError("Notification not found")
	}

	return nil
}

// MarkAllAsRead marks all notifications as read for a tenant/user
func (s *notificationService) MarkAllAsRead(ctx context.Context, tenantID string, userID *string) error {
	now := time.Now()
	query := s.db.WithContext(ctx).Model(&entity.Notification{}).Where("tenant_id = ? AND is_read = ?", tenantID, false)

	if userID != nil {
		query = query.Where("user_id = ? OR user_id IS NULL", *userID)
	}

	if err := query.Updates(map[string]interface{}{"is_read": true, "read_at": now}).Error; err != nil {
		return errors.NewInternalError("Failed to mark all notifications as read")
	}

	return nil
}

// DeleteNotification deletes a notification
func (s *notificationService) DeleteNotification(ctx context.Context, tenantID, notificationID string) error {
	result := s.db.WithContext(ctx).Where("id = ? AND tenant_id = ?", notificationID, tenantID).Delete(&entity.Notification{})
	if result.Error != nil {
		return errors.NewInternalError("Failed to delete notification")
	}
	if result.RowsAffected == 0 {
		return errors.NewNotFoundError("Notification not found")
	}
	return nil
}

// Admin notification methods
func (s *notificationService) CreateAdminNotification(ctx context.Context, notification *entity.AdminNotification) error {
	if err := s.db.WithContext(ctx).Create(notification).Error; err != nil {
		return errors.NewInternalError("Failed to create admin notification")
	}

	// Publish to Redis
	channel := GlobalAdminChannel
	if notification.AdminID != nil {
		channel = AdminNotificationChannel + *notification.AdminID
	}
	s.PublishNotification(ctx, channel, notification)

	return nil
}

func (s *notificationService) GetAdminNotifications(ctx context.Context, adminID *string, page, perPage int, unreadOnly bool) ([]*entity.AdminNotification, int64, error) {
	var notifications []*entity.AdminNotification
	var total int64

	offset := (page - 1) * perPage
	query := s.db.WithContext(ctx).Model(&entity.AdminNotification{})

	if adminID != nil {
		query = query.Where("admin_id = ? OR admin_id IS NULL", *adminID)
	}

	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&notifications).Error; err != nil {
		return nil, 0, err
	}

	return notifications, total, nil
}

func (s *notificationService) GetAdminUnreadCount(ctx context.Context, adminID *string) (int64, error) {
	var count int64
	query := s.db.WithContext(ctx).Model(&entity.AdminNotification{}).Where("is_read = ?", false)

	if adminID != nil {
		query = query.Where("admin_id = ? OR admin_id IS NULL", *adminID)
	}

	if err := query.Count(&count).Error; err != nil {
		return 0, err
	}

	return count, nil
}

func (s *notificationService) MarkAdminAsRead(ctx context.Context, notificationID string) error {
	now := time.Now()
	result := s.db.WithContext(ctx).Model(&entity.AdminNotification{}).
		Where("id = ?", notificationID).
		Updates(map[string]interface{}{"is_read": true, "read_at": now})

	if result.Error != nil {
		return errors.NewInternalError("Failed to mark notification as read")
	}
	if result.RowsAffected == 0 {
		return errors.NewNotFoundError("Notification not found")
	}

	return nil
}

func (s *notificationService) MarkAllAdminAsRead(ctx context.Context, adminID *string) error {
	now := time.Now()
	query := s.db.WithContext(ctx).Model(&entity.AdminNotification{}).Where("is_read = ?", false)

	if adminID != nil {
		query = query.Where("admin_id = ? OR admin_id IS NULL", *adminID)
	}

	if err := query.Updates(map[string]interface{}{"is_read": true, "read_at": now}).Error; err != nil {
		return errors.NewInternalError("Failed to mark all notifications as read")
	}

	return nil
}

// DeleteAdminNotification deletes an admin notification
func (s *notificationService) DeleteAdminNotification(ctx context.Context, notificationID string) error {
	result := s.db.WithContext(ctx).Where("id = ?", notificationID).Delete(&entity.AdminNotification{})
	if result.Error != nil {
		return errors.NewInternalError("Failed to delete notification")
	}
	if result.RowsAffected == 0 {
		return errors.NewNotFoundError("Notification not found")
	}
	return nil
}

// Redis Pub/Sub methods
func (s *notificationService) PublishNotification(ctx context.Context, channel string, notification interface{}) error {
	if s.redis == nil {
		logger.Info("Redis not available, skipping publish")
		return nil
	}

	data, err := json.Marshal(notification)
	if err != nil {
		return err
	}

	if err := s.redis.Publish(ctx, channel, data).Err(); err != nil {
		logger.Error("Failed to publish notification: %v", err)
		return err
	}

	return nil
}

func (s *notificationService) SubscribeNotifications(ctx context.Context, channel string) (<-chan *redis.Message, func()) {
	if s.redis == nil {
		ch := make(chan *redis.Message)
		close(ch)
		return ch, func() {}
	}

	pubsub := s.redis.Subscribe(ctx, channel)
	return pubsub.Channel(), func() { pubsub.Close() }
}

// Helper function to create notification for specific events
func CreatePaymentNotification(tenantID, userID, orderID, status string, amount float64) *entity.Notification {
	title := "Pembayaran Berhasil"
	message := fmt.Sprintf("Pembayaran sebesar Rp %.0f telah berhasil diproses.", amount)
	notifType := entity.NotificationTypeSuccess

	if status == "pending" {
		title = "Menunggu Pembayaran"
		message = fmt.Sprintf("Silakan selesaikan pembayaran sebesar Rp %.0f.", amount)
		notifType = entity.NotificationTypePayment
	} else if status == "failed" || status == "expired" {
		title = "Pembayaran Gagal"
		message = "Pembayaran Anda gagal atau kadaluarsa. Silakan coba lagi."
		notifType = entity.NotificationTypeError
	}

	data, _ := json.Marshal(map[string]interface{}{"order_id": orderID, "amount": amount, "status": status})

	return &entity.Notification{
		TenantID: tenantID,
		UserID:   &userID,
		Type:     notifType,
		Title:    title,
		Message:  message,
		Data:     string(data),
	}
}

func CreateTicketNotification(tenantID string, userID *string, ticketID, subject, status string) *entity.Notification {
	title := "Tiket Support Diperbarui"
	message := fmt.Sprintf("Tiket '%s' telah diperbarui.", subject)

	if status == "resolved" {
		title = "Tiket Diselesaikan"
		message = fmt.Sprintf("Tiket '%s' telah diselesaikan.", subject)
	} else if status == "in_progress" {
		title = "Tiket Sedang Diproses"
		message = fmt.Sprintf("Tiket '%s' sedang diproses oleh tim support.", subject)
	}

	data, _ := json.Marshal(map[string]interface{}{"ticket_id": ticketID, "status": status})

	return &entity.Notification{
		TenantID: tenantID,
		UserID:   userID,
		Type:     entity.NotificationTypeTicket,
		Title:    title,
		Message:  message,
		Data:     string(data),
	}
}

func CreateSubscriptionNotification(tenantID string, planName, status string, daysLeft int) *entity.Notification {
	title := "Langganan Aktif"
	message := fmt.Sprintf("Langganan %s Anda telah aktif.", planName)
	notifType := entity.NotificationTypeSuccess

	if status == "expiring" {
		title = "Langganan Akan Berakhir"
		message = fmt.Sprintf("Langganan %s Anda akan berakhir dalam %d hari.", planName, daysLeft)
		notifType = entity.NotificationTypeWarning
	} else if status == "expired" {
		title = "Langganan Berakhir"
		message = fmt.Sprintf("Langganan %s Anda telah berakhir. Silakan perpanjang.", planName)
		notifType = entity.NotificationTypeError
	}

	data, _ := json.Marshal(map[string]interface{}{"plan_name": planName, "status": status, "days_left": daysLeft})

	return &entity.Notification{
		TenantID: tenantID,
		Type:     notifType,
		Title:    title,
		Message:  message,
		Data:     string(data),
	}
}
