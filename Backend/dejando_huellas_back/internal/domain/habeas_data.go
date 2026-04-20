package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type HabeasData struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Content   string             `bson:"content" json:"content"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type UpdateHabeasDataRequest struct {
	Content string `json:"content" binding:"required"`
}
