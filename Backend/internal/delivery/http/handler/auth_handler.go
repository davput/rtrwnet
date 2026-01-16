package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/delivery/http/dto"
	"github.com/rtrwnet/saas-backend/internal/domain/entity"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type AuthHandler struct {
	authService usecase.AuthService
}

func NewAuthHandler(authService usecase.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login godoc
// @Summary      Standard login with tenant ID
// @Description  Login using tenant ID, email, and password. Requires tenant ID to be provided in request body.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        request  body      dto.LoginRequest  true  "Login credentials with tenant ID"
// @Success      200      {object}  response.SuccessResponse{data=usecase.AuthResponse}  "Login successful"
// @Failure      400      {object}  response.ErrorResponse  "Validation error or missing tenant ID"
// @Failure      401      {object}  response.ErrorResponse  "Invalid credentials"
// @Failure      403      {object}  response.ErrorResponse  "Tenant or user inactive"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":     "Invalid request data",
			"tenant_id": "Must be a valid UUID",
			"email":     "Must be a valid email address",
			"password":  "Must be at least 6 characters",
		})
		return
	}

	// Validate required fields
	if req.TenantID == "" {
		response.BadRequest(c, "VAL_2006", "Missing tenant_id", map[string]interface{}{
			"tenant_id": "Tenant ID is required for standard login. Use /auth/simple-login for login without tenant ID",
		})
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), req.TenantID, req.Email, req.Password)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Login successful", resp)
}

// SimpleLogin godoc
// @Summary      Simple login with email only
// @Description  Login using email and password without requiring tenant ID. System will automatically find tenant from email.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        request  body      dto.SimpleLoginRequest  true  "Login credentials"
// @Success      200      {object}  response.SuccessResponse{data=usecase.AuthResponse}  "Login successful"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      401      {object}  response.ErrorResponse  "Invalid credentials"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /auth/simple-login [post]
func (h *AuthHandler) SimpleLogin(c *gin.Context) {
	var req dto.SimpleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":    "Email and password are required",
			"username": "Must be a valid email address",
			"password": "Must be at least 6 characters",
		})
		return
	}

	// Additional validation
	if len(req.Username) < 3 {
		response.BadRequest(c, "VAL_2006", "Invalid email", map[string]interface{}{
			"username": "Email must be at least 3 characters",
		})
		return
	}

	if len(req.Password) < 6 {
		response.BadRequest(c, "VAL_2005", "Invalid password", map[string]interface{}{
			"password": "Password must be at least 6 characters",
		})
		return
	}

	resp, err := h.authService.SimpleLogin(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Login successful", resp)
}

// Logout godoc
// @Summary      Logout user
// @Description  Invalidate refresh token and logout user. Only requires valid access token, no tenant ID needed.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        request  body      dto.LogoutRequest  true  "Refresh token to invalidate"
// @Success      200      {object}  response.SuccessResponse  "Logged out successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      401      {object}  response.ErrorResponse  "Unauthorized"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	var req dto.LogoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid request data",
		})
		return
	}

	if err := h.authService.Logout(c.Request.Context(), req.RefreshToken); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Logged out successfully", nil)
}

// RefreshToken godoc
// @Summary      Refresh access token
// @Description  Get a new access token using refresh token. Refresh token must be valid and not expired.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        request  body      dto.RefreshTokenRequest  true  "Refresh token"
// @Success      200      {object}  response.SuccessResponse{data=usecase.TokenResponse}  "Token refreshed successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      401      {object}  response.ErrorResponse  "Invalid or expired refresh token"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req dto.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Invalid request data",
		})
		return
	}

	resp, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	response.OK(c, "Token refreshed successfully", resp)
}

// Me godoc
// @Summary      Get current user profile
// @Description  Retrieve authenticated user's profile information. Requires valid access token.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Security     TenantID
// @Success      200  {object}  response.SuccessResponse{data=object}  "User profile retrieved successfully"
// @Failure      401  {object}  response.ErrorResponse  "Unauthorized"
// @Failure      500  {object}  response.ErrorResponse  "Internal server error"
// @Router       /auth/me [get]
func (h *AuthHandler) Me(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		response.Unauthorized(c, "AUTH_1002", "Unauthorized access")
		return
	}

	// Cast to entity.User to access all fields
	if u, ok := user.(*entity.User); ok {
		avatarURL := ""
		if u.AvatarURL != nil {
			avatarURL = *u.AvatarURL
		}
		
		response.OK(c, "User profile retrieved successfully", map[string]interface{}{
			"user": map[string]interface{}{
				"id":         u.ID,
				"tenant_id":  u.TenantID,
				"email":      u.Email,
				"name":       u.Name,
				"role":       u.Role,
				"avatar_url": avatarURL,
				"is_active":  u.IsActive,
				"created_at": u.CreatedAt,
				"updated_at": u.UpdatedAt,
			},
		})
		return
	}

	response.OK(c, "User profile retrieved successfully", map[string]interface{}{
		"user": user,
	})
}


// Register godoc
// @Summary      Register new user
// @Description  Register a new user within an existing tenant. Requires tenant ID, email, password, name, and role.
// @Tags         Authentication
// @Accept       json
// @Produce      json
// @Param        request  body      dto.RegisterRequest  true  "User registration data"
// @Success      201      {object}  response.SuccessResponse{data=dto.RegisterResponse}  "User registered successfully"
// @Failure      400      {object}  response.ErrorResponse  "Validation error"
// @Failure      404      {object}  response.ErrorResponse  "Tenant not found"
// @Failure      409      {object}  response.ErrorResponse  "User already exists"
// @Failure      500      {object}  response.ErrorResponse  "Internal server error"
// @Router       /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error":     "Invalid request data",
			"tenant_id": "Must be a valid UUID",
			"email":     "Must be a valid email address",
			"password":  "Must be at least 6 characters",
			"name":      "Name is required",
			"role":      "Must be one of: admin, operator, technician, viewer",
		})
		return
	}

	user, err := h.authService.Register(c.Request.Context(), req.TenantID, req.Email, req.Password, req.Name, req.Role)
	if err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Internal server error")
		}
		return
	}

	resp := dto.RegisterResponse{
		ID:       user.ID,
		Email:    user.Email,
		Name:     user.Name,
		Role:     user.Role,
		TenantID: user.TenantID,
		Message:  "User registered successfully",
	}

	response.Created(c, "User registered successfully", resp)
}
