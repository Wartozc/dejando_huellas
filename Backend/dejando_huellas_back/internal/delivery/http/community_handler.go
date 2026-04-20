package http

import (
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type CommunityHandler struct {
	uc *usecase.CommunityUseCase
}

func NewCommunityHandler(uc *usecase.CommunityUseCase) *CommunityHandler {
	return &CommunityHandler{uc: uc}
}

func (h *CommunityHandler) Create(c *gin.Context) {
	var req domain.CreateCommunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	community, err := h.uc.Create(c.Request.Context(), &req)
	if err != nil {
		if err == usecase.ErrCommunityAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": "Community already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create community"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Community created successfully", "community": community})
}

func (h *CommunityHandler) GetAll(c *gin.Context) {
	communities, err := h.uc.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get communities"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"communities": communities})
}

func (h *CommunityHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	community, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == usecase.ErrCommunityNotFound || err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "Community not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get community"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"community": community})
}

func (h *CommunityHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req domain.UpdateCommunityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	community, err := h.uc.Update(c.Request.Context(), id, &req)
	if err != nil {
		if err == usecase.ErrCommunityNotFound || err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "Community not found"})
			return
		}
		if err == usecase.ErrCommunityAlreadyExists {
			c.JSON(http.StatusConflict, gin.H{"error": "Community name already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update community"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Community updated successfully", "community": community})
}

func (h *CommunityHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.uc.Delete(c.Request.Context(), id); err != nil {
		if err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "Community not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete community"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Community deleted successfully"})
}
