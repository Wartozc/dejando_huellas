package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Community struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name" binding:"required,min=2,max=100"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateCommunityRequest struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}

type UpdateCommunityRequest struct {
	Name string `json:"name" binding:"omitempty,min=2,max=100"`
}
