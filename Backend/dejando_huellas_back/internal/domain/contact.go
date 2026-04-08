package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Contact struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name" binding:"required,min=2,max=100"`
	Email     string             `bson:"email" json:"email" binding:"required,email"`
	Message   string             `bson:"message" json:"message" binding:"required,min=10"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

type CreateContactRequest struct {
	Name    string `json:"name" binding:"required,min=2,max=100"`
	Email   string `json:"email" binding:"required,email"`
	Message string `json:"message" binding:"required,min=10"`
}
