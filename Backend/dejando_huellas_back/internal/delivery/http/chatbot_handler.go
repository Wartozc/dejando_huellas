package http

import (
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type ChatBotHandler struct {
	uc *usecase.ChatBotUseCase
}

func NewChatBotHandler(uc *usecase.ChatBotUseCase) *ChatBotHandler {
	return &ChatBotHandler{uc: uc}
}

func (h *ChatBotHandler) Create(c *gin.Context) {
	var req domain.CreateChatBotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	option, err := h.uc.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create chatbot option"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "ChatBot option created successfully",
		"option":  option,
	})
}

func (h *ChatBotHandler) GetAll(c *gin.Context) {
	tree, err := h.uc.GetTree(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chatbot options"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"options": tree})
}

func (h *ChatBotHandler) GetByID(c *gin.Context) {
	id := c.Param("id")

	option, err := h.uc.GetByID(c.Request.Context(), id)
	if err != nil {
		if err == usecase.ErrInvalidInput || err == usecase.ErrChatBotOptionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ChatBot option not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get chatbot option"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"option": option})
}

func (h *ChatBotHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var req domain.UpdateChatBotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	option, err := h.uc.Update(c.Request.Context(), id, &req)
	if err != nil {
		if err == usecase.ErrInvalidInput || err == usecase.ErrChatBotOptionNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "ChatBot option not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update chatbot option"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ChatBot option updated successfully", "option": option})
}

func (h *ChatBotHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	if err := h.uc.Delete(c.Request.Context(), id); err != nil {
		if err == usecase.ErrInvalidInput {
			c.JSON(http.StatusNotFound, gin.H{"error": "ChatBot option not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete chatbot option"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ChatBot option deleted successfully"})
}
