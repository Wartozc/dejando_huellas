package usecase

import (
	"context"
	"log"
	"time"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MessageUseCase struct {
	repo     *repository.MessageRepository
	userRepo *repository.UserRepository
}

func NewMessageUseCase(repo *repository.MessageRepository, userRepo *repository.UserRepository) *MessageUseCase {
	return &MessageUseCase{
		repo:     repo,
		userRepo: userRepo,
	}
}

func (uc *MessageUseCase) Create(ctx context.Context, req *domain.CreateMessageRequest, userID, userName string) (*domain.Message, error) {
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	message := &domain.Message{
		Content:  req.Content,
		UserID:   userObjID,
		UserName: userName,
	}

	if err := uc.repo.Create(ctx, message); err != nil {
		return nil, err
	}

	return message, nil
}

func (uc *MessageUseCase) GetAll(ctx context.Context) ([]*domain.Message, error) {
	return uc.repo.GetAll(ctx)
}

func (uc *MessageUseCase) GetSince(ctx context.Context, since string) ([]*domain.Message, error) {
	// Parse the ISO8601 timestamp
	sinceTime, err := time.Parse(time.RFC3339, since)
	if err != nil {
		// If parsing fails, try another format
		sinceTime, err = time.Parse("2006-01-02T15:04:05.000Z", since)
		if err != nil {
			return nil, ErrInvalidInput
		}
	}

	return uc.repo.GetSince(ctx, sinceTime)
}

func (uc *MessageUseCase) GetByID(ctx context.Context, messageID string) (*domain.Message, error) {
	msgID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	return uc.repo.GetByID(ctx, msgID)
}

func (uc *MessageUseCase) Update(ctx context.Context, messageID string, content string, userID string) (*domain.Message, error) {
	msgID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	// Get the existing message
	message, err := uc.repo.GetByID(ctx, msgID)
	if err != nil {
		return nil, err
	}

	if message == nil {
		return nil, ErrNotFound
	}

	// Check if the user is the author
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, ErrInvalidInput
	}

	if message.UserID != userObjID {
		return nil, ErrForbidden
	}

	// Update the message
	message.Content = content
	if err := uc.repo.Update(ctx, message); err != nil {
		return nil, err
	}

	return message, nil
}

func (uc *MessageUseCase) Delete(ctx context.Context, messageID string, userID string) error {
	msgID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return ErrInvalidInput
	}

	// Get the existing message
	message, err := uc.repo.GetByID(ctx, msgID)
	if err != nil {
		return err
	}

	if message == nil {
		return ErrNotFound
	}

	// Check if the user is the author
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidInput
	}

	if message.UserID != userObjID {
		return ErrForbidden
	}

	return uc.repo.Delete(ctx, msgID)
}

func (uc *MessageUseCase) AddReaction(ctx context.Context, messageID string, emoji string, userID string, userName string) error {
	log.Printf("MessageUseCase.AddReaction: === START ===")
	log.Printf("MessageUseCase.AddReaction: Input - messageID=%s, emoji=%s, userID=%s, userName=%s",
		messageID, emoji, userID, userName)

	// Convert messageID to ObjectID
	msgID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		log.Printf("MessageUseCase.AddReaction: ERROR - Invalid messageID format: %v", err)
		return ErrInvalidInput
	}
	log.Printf("MessageUseCase.AddReaction: messageID converted to ObjectID: %s", msgID.Hex())

	// Verify message exists
	log.Printf("MessageUseCase.AddReaction: Calling repo.GetByID for messageID=%s", msgID.Hex())
	message, err := uc.repo.GetByID(ctx, msgID)
	if err != nil {
		log.Printf("MessageUseCase.AddReaction: ERROR from repo.GetByID: %v", err)
		return err
	}

	if message == nil {
		log.Printf("MessageUseCase.AddReaction: Message not found with ID=%s", msgID.Hex())
		return ErrNotFound
	}
	contentPreview := message.Content
	if len(contentPreview) > 50 {
		contentPreview = contentPreview[:50]
	}
	log.Printf("MessageUseCase.AddReaction: Message found: ID=%s, Content=%s...", msgID.Hex(), contentPreview)

	// Convert userID to ObjectID
	log.Printf("MessageUseCase.AddReaction: Converting userID=%s to ObjectID", userID)
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		log.Printf("MessageUseCase.AddReaction: ERROR - Invalid userID format: %v", err)
		return ErrInvalidInput
	}
	log.Printf("MessageUseCase.AddReaction: userID converted to ObjectID: %s", userObjID.Hex())

	reaction := &domain.Reaction{
		UserID:   userObjID,
		UserName: userName,
		Emoji:    emoji,
	}
	log.Printf("MessageUseCase.AddReaction: Created reaction struct: UserID=%s, UserName=%s, Emoji=%s",
		reaction.UserID.Hex(), reaction.UserName, reaction.Emoji)

	log.Printf("MessageUseCase.AddReaction: Calling repo.AddReaction...")
	err = uc.repo.AddReaction(ctx, msgID, reaction)
	if err != nil {
		log.Printf("MessageUseCase.AddReaction: ERROR from repo.AddReaction: %v", err)
		return err
	}

	log.Printf("MessageUseCase.AddReaction: SUCCESS - Reaction added")
	return nil
}

func (uc *MessageUseCase) RemoveReaction(ctx context.Context, messageID string, emoji string, userID string) error {
	msgID, err := primitive.ObjectIDFromHex(messageID)
	if err != nil {
		return ErrInvalidInput
	}

	// Verify message exists
	message, err := uc.repo.GetByID(ctx, msgID)
	if err != nil {
		return err
	}

	if message == nil {
		return ErrNotFound
	}

	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return ErrInvalidInput
	}

	return uc.repo.RemoveReaction(ctx, msgID, userObjID, emoji)
}

// DeleteAll removes all messages (admin only)
func (uc *MessageUseCase) DeleteAll(ctx context.Context) error {
	log.Println("MessageUseCase.DeleteAll: Deleting all messages...")

	err := uc.repo.DeleteAll(ctx)
	if err != nil {
		log.Printf("MessageUseCase.DeleteAll: Error: %v", err)
		return err
	}

	log.Println("MessageUseCase.DeleteAll: All messages deleted successfully")
	return nil
}
