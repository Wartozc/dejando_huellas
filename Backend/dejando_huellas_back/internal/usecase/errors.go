package usecase

import "errors"

var (
	ErrEmailAlreadyExists     = errors.New("email already exists")
	ErrUserNotFound           = errors.New("user not found")
	ErrInvalidInput           = errors.New("invalid input")
	ErrUnauthorized           = errors.New("unauthorized")
	ErrNotFound               = errors.New("not found")
	ErrForbidden              = errors.New("forbidden")
	ErrCommunityNotFound      = errors.New("community not found")
	ErrCommunityAlreadyExists = errors.New("community already exists")
)
