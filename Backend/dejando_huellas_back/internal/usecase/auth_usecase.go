package usecase

import (
	"context"
	"errors"
	"time"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotApproved    = errors.New("user not approved")
	ErrUserPending        = errors.New("user is pending approval")
)

type AuthUseCase struct {
	repo      *repository.UserRepository
	jwtSecret []byte
}

type JWTClaims struct {
	UserID    string      `json:"user_id"`
	Name      string      `json:"name"`
	Email     string      `json:"email"`
	Role      domain.Role `json:"role"`
	Community string      `json:"community"`
	jwt.RegisteredClaims
}

func NewAuthUseCase(repo *repository.UserRepository) *AuthUseCase {
	return &AuthUseCase{repo: repo}
}

func (uc *AuthUseCase) SetJWTSecret(secret string) {
	uc.jwtSecret = []byte(secret)
}

func (uc *AuthUseCase) Login(ctx context.Context, req *domain.LoginRequest) (*domain.LoginResponse, error) {
	user, err := uc.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}

	if user.Status == domain.StatusPending {
		return nil, ErrUserPending
	}

	if user.Status == domain.StatusRejected {
		return nil, ErrUserNotApproved
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	token, err := uc.generateToken(user)
	if err != nil {
		return nil, err
	}

	return &domain.LoginResponse{
		Token: token,
		User:  user,
	}, nil
}

func (uc *AuthUseCase) generateToken(user *domain.User) (string, error) {
	claims := &JWTClaims{
		UserID:    user.ID.Hex(),
		Name:      user.Name,
		Email:     user.Email,
		Role:      user.Role,
		Community: user.Community,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(uc.jwtSecret)
}

func (uc *AuthUseCase) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return uc.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
