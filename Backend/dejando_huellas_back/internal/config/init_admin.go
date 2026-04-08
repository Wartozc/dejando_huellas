package config

import (
	"context"
	"log"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

const (
	DefaultAdminEmail    = "admin@dejandohuellas.com"
	DefaultAdminPassword = "admin123"
	DefaultAdminName     = "Administrator"
)

// InitData holds the configuration for initial data setup
type InitData struct {
	AdminEmail    string
	AdminPassword string
	AdminName     string
}

// DefaultInitData returns the default admin user configuration
func DefaultInitData() *InitData {
	return &InitData{
		AdminEmail:    DefaultAdminEmail,
		AdminPassword: DefaultAdminPassword,
		AdminName:     DefaultAdminName,
	}
}

// InitializeAdmin creates the initial admin user if it doesn't exist
func InitializeAdmin(ctx context.Context, userRepo *repository.UserRepository, initData *InitData) error {
	if initData == nil {
		initData = DefaultInitData()
	}

	// Check if admin already exists
	exists, err := userRepo.ExistsByEmail(ctx, initData.AdminEmail)
	if err != nil {
		return err
	}

	if exists {
		log.Println("Admin user already exists, skipping initialization")
		return nil
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(initData.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// Create admin user with APPROVED status
	admin := &domain.User{
		Name:     initData.AdminName,
		Email:    initData.AdminEmail,
		Password: string(hashedPassword),
		Role:     domain.RoleAdmin,
		Status:   domain.StatusApproved,
	}

	if err := userRepo.Create(ctx, admin); err != nil {
		return err
	}

	log.Printf("✓ Initial admin user created successfully!")
	log.Printf("  Email: %s", initData.AdminEmail)
	log.Printf("  Password: %s", initData.AdminPassword)
	log.Printf("  Status: APPROVED (no approval needed)")

	return nil
}
