package postgres

import (
	"context"
	"fmt"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"gorm.io/gorm"
)

type chatRepository struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) repository.ChatRepository {
	return &chatRepository{db: db}
}

func (r *chatRepository) CreateRoom(ctx context.Context, room *entity.ChatRoom) error {
	if err := r.db.WithContext(ctx).Create(room).Error; err != nil {
		return fmt.Errorf("failed to create chat room: %w", err)
	}
	return nil
}

func (r *chatRepository) GetRoomByID(ctx context.Context, id string) (*entity.ChatRoom, error) {
	var room entity.ChatRoom
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&room).Error; err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *chatRepository) GetActiveRoomByUserID(ctx context.Context, userID string) (*entity.ChatRoom, error) {
	var room entity.ChatRoom
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND status IN ('waiting', 'active')", userID).
		Order("created_at DESC").
		First(&room).Error
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *chatRepository) GetRoomsByTenantID(ctx context.Context, tenantID string) ([]*entity.ChatRoom, error) {
	var rooms []*entity.ChatRoom
	err := r.db.WithContext(ctx).
		Where("tenant_id = ?", tenantID).
		Order("updated_at DESC").
		Find(&rooms).Error
	return rooms, err
}

func (r *chatRepository) GetWaitingRooms(ctx context.Context) ([]*entity.ChatRoom, error) {
	var rooms []*entity.ChatRoom
	err := r.db.WithContext(ctx).
		Where("status = ?", entity.ChatStatusWaiting).
		Order("created_at ASC").
		Find(&rooms).Error
	return rooms, err
}

func (r *chatRepository) GetRoomsByAdminID(ctx context.Context, adminID string) ([]*entity.ChatRoom, error) {
	var rooms []*entity.ChatRoom
	err := r.db.WithContext(ctx).
		Where("admin_id = ? AND status = ?", adminID, entity.ChatStatusActive).
		Order("updated_at DESC").
		Find(&rooms).Error
	return rooms, err
}

func (r *chatRepository) GetAllActiveRooms(ctx context.Context) ([]*entity.ChatRoom, error) {
	var rooms []*entity.ChatRoom
	err := r.db.WithContext(ctx).
		Where("status IN ('waiting', 'active')").
		Order("updated_at DESC").
		Find(&rooms).Error
	return rooms, err
}

func (r *chatRepository) UpdateRoom(ctx context.Context, room *entity.ChatRoom) error {
	if err := r.db.WithContext(ctx).Save(room).Error; err != nil {
		return fmt.Errorf("failed to update chat room: %w", err)
	}
	return nil
}

func (r *chatRepository) CreateMessage(ctx context.Context, msg *entity.ChatMessage) error {
	if err := r.db.WithContext(ctx).Create(msg).Error; err != nil {
		return fmt.Errorf("failed to create chat message: %w", err)
	}
	return nil
}

func (r *chatRepository) GetMessagesByRoomID(ctx context.Context, roomID string, limit int) ([]*entity.ChatMessage, error) {
	var messages []*entity.ChatMessage
	query := r.db.WithContext(ctx).Where("room_id = ?", roomID).Order("created_at ASC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&messages).Error
	return messages, err
}

func (r *chatRepository) MarkMessagesAsRead(ctx context.Context, roomID string, readerType string) error {
	// Mark messages as read where sender is opposite type
	senderType := "admin"
	if readerType == "admin" {
		senderType = "user"
	}
	return r.db.WithContext(ctx).
		Model(&entity.ChatMessage{}).
		Where("room_id = ? AND sender_type = ? AND is_read = false", roomID, senderType).
		Update("is_read", true).Error
}

func (r *chatRepository) GetUnreadCount(ctx context.Context, roomID string, readerType string) (int64, error) {
	var count int64
	senderType := "admin"
	if readerType == "admin" {
		senderType = "user"
	}
	err := r.db.WithContext(ctx).
		Model(&entity.ChatMessage{}).
		Where("room_id = ? AND sender_type = ? AND is_read = false", roomID, senderType).
		Count(&count).Error
	return count, err
}
