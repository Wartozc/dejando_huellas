package usecase

import (
	"context"
	"errors"
	"time"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrEmailAlreadyExists = errors.New("email already exists")
	ErrUserNotFound        = errors.New("user not found")
	ErrInvalidInput        = errors.New("invalid input")
	ErrUnauthorized        = errors.New("unauthorized")
)

type UserUseCase struct {
	repo *repository.UserRepository
}

func NewUserUseCase(repo *repository.UserRepository) *UserUseCase {
	return &UserUseCase{repo: repo}
}

func (uc *UserUseCase) Create(ctx context.Context, req *domain.CreateUserRequest) (*domain.User, error) {
	exists, err := uc.repo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailAlreadyExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := req.Role
	if role == "" {
		role = domain.RoleMember
	}

	user := &domain.User{
		Name:     req.Name,
		Email:    req.Email,
		Phone:    req.Phone,
		Password: string(hashedPassword),
		Role:     role,
		Status:   domain.StatusPending,
	}

	if err := uc.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *UserUseCase) GetByID(ctx context.Context, id string) (*domain.User, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	user, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	return user, nil
}

func (uc *UserUseCase) GetAll(ctx context.Context) ([]*domain.User, error) {
	return uc.repo.GetAll(ctx)
}

func (uc *UserUseCase) Update(ctx context.Context, id string, req *domain.UpdateUserRequest) (*domain.User, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, ErrInvalidInput
	}

	user, err := uc.repo.GetByID(ctx, objID)
	if err != nil {
		return nil, ErrUserNotFound
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.Status != "" {
		user.Status = domain.UserStatus(req.Status)
	}
	user.UpdatedAt = time.Now()

	if err := uc.repo.Update(ctx, objID, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (uc *UserUseCase) Delete(ctx context.Context, id string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return ErrInvalidInput
	}

	return uc.repo.Delete(ctx, objID)
}

func (uc *UserUseCase) ApproveUser(ctx context.Context, id string) (*domain.User, error) {
	return uc.Update(ctx, id, &domain.UpdateUserRequest{Status: string(domain.StatusApproved)})
}

func (uc *UserUseCase) RejectUser(ctx context.Context, id string) (*domain.User, error) {
	return uc.Update(ctx, id, &domain.UpdateUserRequest{Status: string(domain.StatusRejected)})
}
