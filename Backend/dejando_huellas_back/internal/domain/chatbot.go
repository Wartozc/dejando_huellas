package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ChatBotOption struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Question  string             `bson:"question" json:"question" binding:"required,min=1,max=500"`
	Answer    string             `bson:"answer" json:"answer" binding:"required,min=1"`
	ParentID  *string            `bson:"parent_id,omitempty" json:"parent_id,omitempty"`
	Order     int                `bson:"order" json:"order"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateChatBotRequest struct {
	Question string  `json:"question" binding:"required,min=1,max=500"`
	Answer   string  `json:"answer" binding:"required,min=1"`
	ParentID *string `json:"parent_id,omitempty"`
	Order    int     `json:"order"`
}

type UpdateChatBotRequest struct {
	Question string  `json:"question" binding:"omitempty,min=1,max=500"`
	Answer   string  `json:"answer" binding:"omitempty,min=1"`
	ParentID *string `json:"parent_id,omitempty"`
	Order    int     `json:"order"`
}

type ChatBotTreeNode struct {
	ChatBotOption
	Children []ChatBotTreeNode `json:"children,omitempty"`
}
