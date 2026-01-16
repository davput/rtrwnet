package repository

import (
	"context"

	"github.com/rtrwnet/saas-backend/internal/domain/entity"
)

type ChatRepository interface {
	// Room operations
	CreateRoom(ctx context.Context, room *entity.ChatRoom) error
	GetRoomByID(ctx context.Context, id string) (*entity.ChatRoom, error)
	GetActiveRoomByUserID(ctx context.Context, userID string) (*entity.ChatRoom, error)
	GetRoomsByTenantID(ctx context.Context, tenantID string) ([]*entity.ChatRoom, error)
	GetWaitingRooms(ctx context.Context) ([]*entity.ChatRoom, error)
	GetRoomsByAdminID(ctx context.Context, adminID string) ([]*entity.ChatRoom, error)
	GetAllActiveRooms(ctx context.Context) ([]*entity.ChatRoom, error)
	UpdateRoom(ctx context.Context, room *entity.ChatRoom) error
	
	// Message operations
	CreateMessage(ctx context.Context, msg *entity.ChatMessage) error
	GetMessagesByRoomID(ctx context.Context, roomID string, limit int) ([]*entity.ChatMessage, error)
	MarkMessagesAsRead(ctx context.Context, roomID string, readerType string) error
	GetUnreadCount(ctx context.Context, roomID string, readerType string) (int64, error)
}
