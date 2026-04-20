package http

import (
	"log"
	"net/http"
	"strings"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	uc *usecase.UserUseCase
}

func NewUserHandler(uc *usecase.UserUseCase) *UserHandler {
	return &UserHandler{uc: uc}
}

func (h *UserHandler) Create(c *gin.Context) {
	var req domain.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.uc.Create(c.Request.Context(), &req)
	if err != nil {
		if err == usecase.ErrEmailAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully. Pending admin approval.",
		"user":    user,
	})
}

func (h *UserHandler) GetAll(c *gin.Context) {
	users, err := h.uc.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	user, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == usecase.ErrUserNotFound || err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *UserHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req domain.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.uc.Update(c.Request.Context(), id, &req)
	if err != nil {
		if err == usecase.ErrUserNotFound || err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.uc.Delete(c.Request.Context(), id); err != nil {
		if err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func (h *UserHandler) Approve(c *gin.Context) {
	id := c.Param("id")

	user, err := h.uc.ApproveUser(c.Request.Context(), id)
	if err != nil {
		if err == usecase.ErrUserNotFound || err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User approved successfully", "user": user})
}

func (h *UserHandler) Reject(c *gin.Context) {
	id := c.Param("id")

	user, err := h.uc.RejectUser(c.Request.Context(), id)
	if err != nil {
		if err == usecase.ErrUserNotFound || err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User rejected", "user": user})
}

func (h *UserHandler) RegisterMember(c *gin.Context) {
	var req domain.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Println("RegisterMember: received community:", req.Community)

	req.Role = domain.RoleMember

	user, err := h.uc.Create(c.Request.Context(), &req)
	if err != nil {
		if err == usecase.ErrEmailAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create member"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Member registered successfully. Pending admin approval.",
		"user":    user,
	})
}

func GetUserIDFromClaims(c *gin.Context) string {
	if userID, exists := c.Get("user_id"); exists {
		return userID.(string)
	}
	return ""
}

func GetUserNameFromClaims(c *gin.Context) string {
	if userName, exists := c.Get("name"); exists {
		return userName.(string)
	}
	return ""
}

func GetRoleFromClaims(c *gin.Context) string {
	if role, exists := c.Get("role"); exists {
		return strings.ToUpper(role.(string))
	}
	return ""
}

func GetCommunityFromClaims(c *gin.Context) string {
	if community, exists := c.Get("community"); exists {
		return community.(string)
	}
	return ""
}
