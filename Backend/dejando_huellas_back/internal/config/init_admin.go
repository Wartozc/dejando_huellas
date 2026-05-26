package config

import (
	"context"
	"log"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

// InitData holds the configuration for initial data setup
type InitData struct {
	AdminEmail    string
	AdminPassword string
	AdminName     string
}

// InitializeAdmin creates the initial admin user if it doesn't exist.
// Requires AdminEmail and AdminPassword to be set (from .env or environment variables).
// If they are empty, the admin creation is skipped for security reasons.
func InitializeAdmin(ctx context.Context, userRepo *repository.UserRepository, initData *InitData) error {
	if initData == nil || initData.AdminEmail == "" || initData.AdminPassword == "" {
		log.Println("WARNING: Admin credentials not configured. Skipping admin initialization.")
		log.Println("Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file or environment variables.")
		return nil
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
	log.Printf("  Status: APPROVED (no approval needed)")

	return nil
}
