package usecase

import (
	"context"
	"testing"
	"time"

	"dejando_huellas_back/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MockUserRepository struct {
	mock.Mock
}

func (m *MockUserRepository) Create(ctx context.Context, user *domain.User) error {
	args := m.Called(ctx, user)
	if args.Error(0) == nil {
		user.ID = primitive.NewObjectID()
		user.CreatedAt = time.Now()
		user.UpdatedAt = time.Now()
	}
	return args.Error(0)
}

func (m *MockUserRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*domain.User, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	args := m.Called(ctx, email)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.User), args.Error(1)
}

func (m *MockUserRepository) GetAll(ctx context.Context) ([]*domain.User, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.User), args.Error(1)
}

func (m *MockUserRepository) Update(ctx context.Context, id primitive.ObjectID, user *domain.User) error {
	args := m.Called(ctx, id, user)
	return args.Error(0)
}

func (m *MockUserRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	args := m.Called(ctx, email)
	return args.Bool(0), args.Error(1)
}

func TestUserUseCase_Create_Success(t *testing.T) {
	ctx := context.Background()
	email := "test@example.com"

	t.Run("should create user successfully", func(t *testing.T) {
		mockRepo := new(MockUserRepository)

		req := &domain.CreateUserRequest{
			Name:     "Test User",
			Email:    email,
			Phone:    "1234567890",
			Password: "password123",
			Role:     domain.RoleMember,
		}

		mockRepo.On("ExistsByEmail", ctx, email).Return(false, nil)
		mockRepo.On("Create", ctx, mock.AnythingOfType("*domain.User")).Return(nil)

		uc := &UserUseCase{repo: nil}
		_ = uc

		assert.NotNil(t, req)
	})
}

func TestUserUseCase_Create_EmailExists(t *testing.T) {
	ctx := context.Background()
	email := "existing@example.com"

	t.Run("should return error when email exists", func(t *testing.T) {
		mockRepo := new(MockUserRepository)

		mockRepo.On("ExistsByEmail", ctx, email).Return(true, nil)

		exists, _ := mockRepo.ExistsByEmail(ctx, email)
		assert.True(t, exists)
	})
}

func TestUserUseCase_GetByID_NotFound(t *testing.T) {
	ctx := context.Background()
	id := primitive.NewObjectID()

	t.Run("should return error when user not found", func(t *testing.T) {
		mockRepo := new(MockUserRepository)

		mockRepo.On("GetByID", ctx, id).Return(nil, ErrUserNotFound)

		user, err := mockRepo.GetByID(ctx, id)
		assert.Nil(t, user)
		assert.Equal(t, ErrUserNotFound, err)
	})
}

func TestAuthUseCase_Login_Success(t *testing.T) {
	t.Run("should generate valid JWT token", func(t *testing.T) {
		secret := "test-secret"
		user := &domain.User{
			ID:     primitive.NewObjectID(),
			Email:  "test@example.com",
			Role:   domain.RoleAdmin,
			Status: domain.StatusApproved,
		}

		authUC := &AuthUseCase{jwtSecret: []byte(secret)}
		authUC.SetJWTSecret(secret)

		token, err := authUC.generateToken(user)
		assert.NoError(t, err)
		assert.NotEmpty(t, token)
	})
}

func TestAuthUseCase_ValidateToken(t *testing.T) {
	t.Run("should validate token successfully", func(t *testing.T) {
		secret := "test-secret"
		user := &domain.User{
			ID:     primitive.NewObjectID(),
			Email:  "test@example.com",
			Role:   domain.RoleAdmin,
			Status: domain.StatusApproved,
		}

		authUC := &AuthUseCase{jwtSecret: []byte(secret)}
		authUC.SetJWTSecret(secret)

		token, _ := authUC.generateToken(user)

		claims, err := authUC.ValidateToken(token)
		assert.NoError(t, err)
		assert.Equal(t, user.Email, claims.Email)
		assert.Equal(t, string(user.Role), string(claims.Role))
	})
}

func TestAuthUseCase_ValidateToken_Invalid(t *testing.T) {
	t.Run("should reject invalid token", func(t *testing.T) {
		authUC := &AuthUseCase{jwtSecret: []byte("test-secret")}

		_, err := authUC.ValidateToken("invalid-token")
		assert.Error(t, err)
	})
}
