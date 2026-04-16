package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Reaction represents an emoji reaction on a message
type Reaction struct {
	UserID   primitive.ObjectID `bson:"user_id" json:"user_id"`
	UserName string             `bson:"user_name" json:"user_name"`
	Emoji    string             `bson:"emoji" json:"emoji"`
}

// Message represents a chat message
type Message struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Content   string             `bson:"content" json:"content" binding:"required,min=1,max=1000"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	UserName  string             `bson:"user_name" json:"user_name"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt *time.Time         `bson:"updated_at,omitempty" json:"updated_at,omitempty"`
	IsEdited  bool               `bson:"is_edited" json:"is_edited"`
	Reactions []Reaction         `bson:"reactions" json:"reactions"`
}

type CreateMessageRequest struct {
	Content string `json:"content" binding:"required,min=1,max=1000"`
}

type UpdateMessageRequest struct {
	Content string `json:"content" binding:"required,min=1,max=1000"`
}

type ReactionRequest struct {
	Emoji string `json:"emoji" binding:"required"`
}

type GetMessagesResponse struct {
	Messages []*Message `json:"messages"`
}
