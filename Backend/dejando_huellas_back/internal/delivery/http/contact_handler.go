package http

import (
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type ContactHandler struct {
	uc *usecase.ContactUseCase
}

func NewContactHandler(uc *usecase.ContactUseCase) *ContactHandler {
	return &ContactHandler{uc: uc}
}

func (h *ContactHandler) Create(c *gin.Context) {
	var req domain.CreateContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	contact, err := h.uc.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Message sent successfully",
		"contact": contact,
	})
}

func (h *ContactHandler) GetAll(c *gin.Context) {
	contacts, err := h.uc.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"contacts": contacts})
}
