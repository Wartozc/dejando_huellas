package http

import (
	"log"
	"net/http"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
)

type MessageHandler struct {
	uc *usecase.MessageUseCase
}

func NewMessageHandler(uc *usecase.MessageUseCase) *MessageHandler {
	return &MessageHandler{uc: uc}
}

func (h *MessageHandler) Create(c *gin.Context) {
	var req domain.CreateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("MessageHandler.Create: Binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate content is not empty or whitespace only
	if len(req.Content) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message content cannot be empty"})
		return
	}

	userID := GetUserIDFromClaims(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user name from claims
	userName := c.GetString("name")
	if userName == "" {
		userName = c.GetString("email")
	}

	message, err := h.uc.Create(c.Request.Context(), &req, userID, userName)
	if err != nil {
		log.Printf("MessageHandler.Create: Error creating message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create message"})
		return
	}

	log.Printf("MessageHandler.Create: Message created by user %s", userName)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Message created successfully",
		"data":    message,
	})
}

func (h *MessageHandler) GetAll(c *gin.Context) {
	log.Println("MessageHandler.GetAll: Fetching all messages...")

	messages, err := h.uc.GetAll(c.Request.Context())
	if err != nil {
		log.Printf("MessageHandler.GetAll: Error fetching messages: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	if messages == nil {
		messages = []*domain.Message{}
	}

	log.Printf("MessageHandler.GetAll: Found %d messages", len(messages))
	c.JSON(http.StatusOK, domain.GetMessagesResponse{
		Messages: messages,
	})
}

func (h *MessageHandler) GetSince(c *gin.Context) {
	since := c.Query("since")
	if since == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing 'since' parameter"})
		return
	}

	log.Printf("MessageHandler.GetSince: Fetching messages since %s", since)

	messages, err := h.uc.GetSince(c.Request.Context(), since)
	if err != nil {
		log.Printf("MessageHandler.GetSince: Error fetching messages: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid 'since' parameter format"})
		return
	}

	if messages == nil {
		messages = []*domain.Message{}
	}

	log.Printf("MessageHandler.GetSince: Found %d new messages", len(messages))
	c.JSON(http.StatusOK, domain.GetMessagesResponse{
		Messages: messages,
	})
}

// Update handles PUT /api/v1/messages/:id
func (h *MessageHandler) Update(c *gin.Context) {
	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing message ID"})
		return
	}

	var req domain.UpdateMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("MessageHandler.Update: Binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Content) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message content cannot be empty"})
		return
	}

	userID := GetUserIDFromClaims(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	message, err := h.uc.Update(c.Request.Context(), messageID, req.Content, userID)
	if err != nil {
		log.Printf("MessageHandler.Update: Error updating message: %v", err)

		switch err {
		case usecase.ErrNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		case usecase.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only edit your own messages"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update message"})
		}
		return
	}

	log.Printf("MessageHandler.Update: Message %s updated by user %s", messageID, userID)
	c.JSON(http.StatusOK, gin.H{
		"message": "Message updated successfully",
		"data":    message,
	})
}

// Delete handles DELETE /api/v1/messages/:id
func (h *MessageHandler) Delete(c *gin.Context) {
	messageID := c.Param("id")
	if messageID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing message ID"})
		return
	}

	userID := GetUserIDFromClaims(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := h.uc.Delete(c.Request.Context(), messageID, userID)
	if err != nil {
		log.Printf("MessageHandler.Delete: Error deleting message: %v", err)

		switch err {
		case usecase.ErrNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		case usecase.ErrForbidden:
			c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own messages"})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message"})
		}
		return
	}

	log.Printf("MessageHandler.Delete: Message %s deleted by user %s", messageID, userID)
	c.JSON(http.StatusOK, gin.H{
		"message": "Message deleted successfully",
	})
}

// AddReaction handles POST /api/v1/messages/:id/reactions
func (h *MessageHandler) AddReaction(c *gin.Context) {
	messageID := c.Param("id")
	log.Printf("MessageHandler.AddReaction: === START ===")
	log.Printf("MessageHandler.AddReaction: Called with messageID=%s", messageID)

	if messageID == "" {
		log.Printf("MessageHandler.AddReaction: ERROR - Empty messageID")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing message ID"})
		return
	}

	var req domain.ReactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("MessageHandler.AddReaction: ERROR - Binding error: %v", err)
		log.Printf("MessageHandler.AddReaction: Raw body: %s", c.GetHeader("Content-Type"))
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("MessageHandler.AddReaction: Request body parsed successfully - Emoji=%s", req.Emoji)

	if req.Emoji == "" {
		log.Printf("MessageHandler.AddReaction: ERROR - Empty emoji")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Emoji is required"})
		return
	}

	userID := GetUserIDFromClaims(c)
	log.Printf("MessageHandler.AddReaction: UserID from claims=%s", userID)

	if userID == "" {
		log.Printf("MessageHandler.AddReaction: ERROR - Empty userID from claims")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user name from claims
	userName := c.GetString("name")
	if userName == "" {
		userName = c.GetString("email")
	}
	log.Printf("MessageHandler.AddReaction: UserName=%s", userName)

	log.Printf("MessageHandler.AddReaction: Calling usecase.AddReaction with: messageID=%s, emoji=%s, userID=%s, userName=%s",
		messageID, req.Emoji, userID, userName)

	err := h.uc.AddReaction(c.Request.Context(), messageID, req.Emoji, userID, userName)
	if err != nil {
		log.Printf("MessageHandler.AddReaction: ERROR from usecase: %v", err)
		log.Printf("MessageHandler.AddReaction: ERROR type: %T", err)

		switch err {
		case usecase.ErrNotFound:
			log.Printf("MessageHandler.AddReaction: Message not found")
			c.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		case usecase.ErrInvalidInput:
			log.Printf("MessageHandler.AddReaction: Invalid input error")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		default:
			log.Printf("MessageHandler.AddReaction: Unknown error, returning 500")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add reaction: " + err.Error()})
		}
		return
	}

	log.Printf("MessageHandler.AddReaction: SUCCESS - Reaction %s added to message %s by user %s", req.Emoji, messageID, userID)
	c.JSON(http.StatusOK, gin.H{
		"message": "Reaction added successfully",
	})
}

// DeleteAll handles DELETE /api/v1/messages (admin only - clears all messages)
func (h *MessageHandler) DeleteAll(c *gin.Context) {
	log.Println("MessageHandler.DeleteAll: Clearing all messages...")

	// Verify admin role
	userRole, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
		return
	}

	log.Printf("MessageHandler.DeleteAll: User role=%s", userRole)

	err := h.uc.DeleteAll(c.Request.Context())
	if err != nil {
		log.Printf("MessageHandler.DeleteAll: Error clearing all messages: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to clear messages"})
		return
	}

	log.Println("MessageHandler.DeleteAll: All messages cleared successfully")
	c.JSON(http.StatusOK, gin.H{
		"message": "All messages cleared successfully",
	})
}
