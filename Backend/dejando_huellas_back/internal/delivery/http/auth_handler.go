package http

import (
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	uc *usecase.AuthUseCase
}

func NewAuthHandler(uc *usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{uc: uc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.uc.Login(c.Request.Context(), &req)
	if err != nil {
		if err == usecase.ErrInvalidCredentials {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email or password"})
			return
		}
		if err == usecase.ErrUserPending {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account is pending admin approval"})
			return
		}
		if err == usecase.ErrUserNotApproved {
			c.JSON(http.StatusForbidden, gin.H{"error": "Account has been rejected"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": resp.Token,
		"user":  resp.User,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID := GetUserIDFromClaims(c)
	email, _ := c.Get("email")
	role, _ := c.Get("role")

	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"email":   email,
		"role":    role,
	})
}
