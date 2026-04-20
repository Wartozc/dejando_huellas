package domain

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Role string

const (
	RoleAdmin  Role = "ADMIN"
	RoleMember Role = "MEMBER"
)

type UserStatus string

const (
	StatusPending  UserStatus = "PENDING"
	StatusApproved UserStatus = "APPROVED"
	StatusRejected UserStatus = "REJECTED"
)

type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name" binding:"required,min=2,max=100"`
	Email     string             `bson:"email" json:"email" binding:"required,email"`
	Phone     string             `bson:"phone" json:"phone"`
	Password  string             `bson:"password" json:"-"`
	Role      Role               `bson:"role" json:"role"`
	Status    UserStatus         `bson:"status" json:"status"`
	Community string             `bson:"community" json:"community"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

type CreateUserRequest struct {
	Name      string `json:"name" binding:"required,min=2,max=100"`
	Email     string `json:"email" binding:"required,email"`
	Phone     string `json:"phone"`
	Password  string `json:"password" binding:"required,min=6"`
	Role      Role   `json:"role"`
	Community string `json:"community"`
}

type UpdateUserRequest struct {
	Name      string `json:"name" binding:"omitempty,min=2,max=100"`
	Email     string `json:"email" binding:"omitempty,email"`
	Phone     string `json:"phone"`
	Status    string `json:"status"`
	Role      Role   `json:"role"`
	Community string `json:"community"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}
