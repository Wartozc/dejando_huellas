package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Post struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title      string             `bson:"title" json:"title" binding:"required,min=3,max=200"`
	Content    string             `bson:"content" json:"content" binding:"required,min=10"`
	ImageURL   []string           `bson:"image_url" json:"image_url"`
	CreatedBy  primitive.ObjectID `bson:"created_by" json:"created_by"`
	AuthorID   primitive.ObjectID `bson:"author_id" json:"author_id"`
	AuthorName string             `bson:"author_name" json:"author_name"`
	Community  string             `bson:"community" json:"community"`
	Creator    *User              `bson:"creator,omitempty" json:"creator,omitempty"`
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt  time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreatePostRequest struct {
	Title      string   `json:"title" binding:"required,min=3,max=200"`
	Content    string   `json:"content" binding:"required,min=10"`
	ImageURL   []string `json:"image_url"`
	AuthorID   string   `json:"author_id"`
	AuthorName string   `json:"author_name"`
	Community  string   `json:"community"`
}

type UpdatePostRequest struct {
	Title     string   `json:"title" binding:"omitempty,min=3,max=200"`
	Content   string   `json:"content" binding:"omitempty,min=10"`
	ImageURL  []string `json:"image_url"`
	Community string   `json:"community"`
}
