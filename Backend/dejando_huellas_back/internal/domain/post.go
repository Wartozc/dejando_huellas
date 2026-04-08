package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Post struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title     string             `bson:"title" json:"title" binding:"required,min=3,max=200"`
	Content   string             `bson:"content" json:"content" binding:"required,min=10"`
	ImageURL  []string           `bson:"image_url" json:"image_url"`
	CreatedBy primitive.ObjectID `bson:"created_by" json:"created_by"`
	Creator   *User              `bson:"creator,omitempty" json:"creator,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreatePostRequest struct {
	Title    string   `json:"title" binding:"required,min=3,max=200"`
	Content  string   `json:"content" binding:"required,min=10"`
	ImageURL []string `json:"image_url"`
}

type UpdatePostRequest struct {
	Title    string   `json:"title" binding:"omitempty,min=3,max=200"`
	Content  string   `json:"content" binding:"omitempty,min=10"`
	ImageURL []string `json:"image_url"`
}
