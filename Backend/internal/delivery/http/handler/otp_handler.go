package handler

import (
	"github.com/gin-gonic/gin"
	"github.com/rtrwnet/saas-backend/internal/usecase"
	"github.com/rtrwnet/saas-backend/pkg/errors"
	"github.com/rtrwnet/saas-backend/pkg/response"
)

type OTPHandler struct {
	otpService usecase.OTPService
}

func NewOTPHandler(otpService usecase.OTPService) *OTPHandler {
	return &OTPHandler{
		otpService: otpService,
	}
}

// SendOTPRequest represents the request body for sending OTP
type SendOTPRequest struct {
	Email   string `json:"email" binding:"required,email"`
	Purpose string `json:"purpose" binding:"required,oneof=registration reset_password email_change"`
}

// VerifyOTPRequest represents the request body for verifying OTP
type VerifyOTPRequest struct {
	Email   string `json:"email" binding:"required,email"`
	OTP     string `json:"otp" binding:"required,len=6"`
	Purpose string `json:"purpose" binding:"required,oneof=registration reset_password email_change"`
}

// SendOTP handles sending OTP to email
// @Summary Send OTP to email
// @Description Send OTP verification code to email address
// @Tags OTP
// @Accept json
// @Produce json
// @Param request body SendOTPRequest true "Send OTP Request"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Router /api/v1/otp/send [post]
func (h *OTPHandler) SendOTP(c *gin.Context) {
	var req SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Email dan purpose harus diisi dengan benar",
		})
		return
	}

	if err := h.otpService.SendOTP(c.Request.Context(), req.Email, req.Purpose); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.InternalServerError(c, "SRV_9001", "Gagal mengirim OTP")
		}
		return
	}

	response.OK(c, "Kode OTP telah dikirim ke email Anda", map[string]interface{}{
		"email":      req.Email,
		"expires_in": 600, // 10 minutes in seconds
	})
}

// VerifyOTP handles OTP verification
// @Summary Verify OTP
// @Description Verify OTP code sent to email
// @Tags OTP
// @Accept json
// @Produce json
// @Param request body VerifyOTPRequest true "Verify OTP Request"
// @Success 200 {object} response.Response
// @Failure 400 {object} response.Response
// @Router /api/v1/otp/verify [post]
func (h *OTPHandler) VerifyOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VAL_2001", "Validation failed", map[string]interface{}{
			"error": "Email, OTP, dan purpose harus diisi dengan benar",
		})
		return
	}

	if err := h.otpService.VerifyOTP(c.Request.Context(), req.Email, req.OTP, req.Purpose); err != nil {
		if appErr, ok := err.(*errors.AppError); ok {
			response.ErrorFromAppError(c, appErr)
		} else {
			response.BadRequest(c, "INVALID_OTP", "Kode OTP tidak valid", nil)
		}
		return
	}

	response.OK(c, "Email berhasil diverifikasi", map[string]interface{}{
		"email":    req.Email,
		"verified": true,
	})
}
