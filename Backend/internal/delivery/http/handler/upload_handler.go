package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/domain/repository"
	"github.com/rtrwnet/saas-backend/pkg/response"
	"github.com/rtrwnet/saas-backend/pkg/storage"
)

type UploadHandler struct {
	r2Client  *storage.R2Client
	userRepo  repository.UserRepository
	adminRepo repository.AdminUserRepository
}

func NewUploadHandler(r2Client *storage.R2Client, userRepo repository.UserRepository, adminRepo repository.AdminUserRepository) *UploadHandler {
	return &UploadHandler{
		r2Client:  r2Client,
		userRepo:  userRepo,
		adminRepo: adminRepo,
	}
}

// UploadUserAvatar handles avatar upload for tenant users
func (h *UploadHandler) UploadUserAvatar(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if h.r2Client == nil || !h.r2Client.IsConfigured() {
		response.InternalServerError(c, "SRV_9002", "Storage not configured")
		return
	}

	// Get file from form
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		response.BadRequest(c, "VAL_2001", "No file uploaded", nil)
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > storage.MaxFileSize() {
		response.BadRequest(c, "VAL_2002", "File too large. Maximum 5MB allowed", nil)
		return
	}

	// Validate content type
	contentType := header.Header.Get("Content-Type")
	if !storage.AllowedImageTypes()[contentType] {
		response.BadRequest(c, "VAL_2003", "Invalid file type. Only JPEG, PNG, GIF, WebP allowed", nil)
		return
	}

	// Get user to check if they have existing avatar
	user, err := h.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "USR_4001", "User not found")
		return
	}

	// Delete old avatar if exists
	if user.AvatarURL != nil && *user.AvatarURL != "" {
		_ = h.r2Client.DeleteFile(c.Request.Context(), *user.AvatarURL)
	}

	// Upload new avatar
	avatarURL, err := h.r2Client.UploadFile(c.Request.Context(), file, header.Filename, contentType, "avatars/users")
	if err != nil {
		response.InternalServerError(c, "SRV_9003", "Failed to upload file")
		return
	}

	// Update user avatar URL
	user.AvatarURL = &avatarURL
	if err := h.userRepo.Update(c.Request.Context(), user); err != nil {
		response.InternalServerError(c, "SRV_9004", "Failed to update user")
		return
	}

	response.OK(c, "Avatar uploaded successfully", map[string]interface{}{
		"avatar_url": avatarURL,
	})
}

// DeleteUserAvatar handles avatar deletion for tenant users
func (h *UploadHandler) DeleteUserAvatar(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if h.r2Client == nil || !h.r2Client.IsConfigured() {
		response.InternalServerError(c, "SRV_9002", "Storage not configured")
		return
	}

	// Get user
	user, err := h.userRepo.FindByID(c.Request.Context(), userID)
	if err != nil {
		response.NotFound(c, "USR_4001", "User not found")
		return
	}

	// Delete avatar if exists
	if user.AvatarURL != nil && *user.AvatarURL != "" {
		if err := h.r2Client.DeleteFile(c.Request.Context(), *user.AvatarURL); err != nil {
			response.InternalServerError(c, "SRV_9003", "Failed to delete file")
			return
		}
	}

	// Clear avatar URL
	user.AvatarURL = nil
	if err := h.userRepo.Update(c.Request.Context(), user); err != nil {
		response.InternalServerError(c, "SRV_9004", "Failed to update user")
		return
	}

	response.OK(c, "Avatar deleted successfully", nil)
}

// UploadAdminAvatar handles avatar upload for admin users
func (h *UploadHandler) UploadAdminAvatar(c *gin.Context) {
	adminID := c.GetString("admin_id")
	if adminID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if h.r2Client == nil || !h.r2Client.IsConfigured() {
		response.InternalServerError(c, "SRV_9002", "Storage not configured")
		return
	}

	// Get file from form
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		response.BadRequest(c, "VAL_2001", "No file uploaded", nil)
		return
	}
	defer file.Close()

	// Validate file size
	if header.Size > storage.MaxFileSize() {
		response.BadRequest(c, "VAL_2002", "File too large. Maximum 5MB allowed", nil)
		return
	}

	// Validate content type
	contentType := header.Header.Get("Content-Type")
	if !storage.AllowedImageTypes()[contentType] {
		response.BadRequest(c, "VAL_2003", "Invalid file type. Only JPEG, PNG, GIF, WebP allowed", nil)
		return
	}

	// Get admin to check if they have existing avatar
	admin, err := h.adminRepo.GetByID(c.Request.Context(), adminID)
	if err != nil {
		response.NotFound(c, "ADM_4001", "Admin not found")
		return
	}

	// Delete old avatar if exists
	if admin.AvatarURL != nil && *admin.AvatarURL != "" {
		_ = h.r2Client.DeleteFile(c.Request.Context(), *admin.AvatarURL)
	}

	// Upload new avatar
	avatarURL, err := h.r2Client.UploadFile(c.Request.Context(), file, header.Filename, contentType, "avatars/admins")
	if err != nil {
		response.InternalServerError(c, "SRV_9003", "Failed to upload file")
		return
	}

	// Update admin avatar URL
	admin.AvatarURL = &avatarURL
	if err := h.adminRepo.Update(c.Request.Context(), admin); err != nil {
		response.InternalServerError(c, "SRV_9004", "Failed to update admin")
		return
	}

	response.OK(c, "Avatar uploaded successfully", map[string]interface{}{
		"avatar_url": avatarURL,
	})
}

// DeleteAdminAvatar handles avatar deletion for admin users
func (h *UploadHandler) DeleteAdminAvatar(c *gin.Context) {
	adminID := c.GetString("admin_id")
	if adminID == "" {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized")
		return
	}

	if h.r2Client == nil || !h.r2Client.IsConfigured() {
		response.InternalServerError(c, "SRV_9002", "Storage not configured")
		return
	}

	// Get admin
	admin, err := h.adminRepo.GetByID(c.Request.Context(), adminID)
	if err != nil {
		response.NotFound(c, "ADM_4001", "Admin not found")
		return
	}

	// Delete avatar if exists
	if admin.AvatarURL != nil && *admin.AvatarURL != "" {
		if err := h.r2Client.DeleteFile(c.Request.Context(), *admin.AvatarURL); err != nil {
			response.InternalServerError(c, "SRV_9003", "Failed to delete file")
			return
		}
	}

	// Clear avatar URL
	admin.AvatarURL = nil
	if err := h.adminRepo.Update(c.Request.Context(), admin); err != nil {
		response.InternalServerError(c, "SRV_9004", "Failed to update admin")
		return
	}

	response.OK(c, "Avatar deleted successfully", nil)
}
