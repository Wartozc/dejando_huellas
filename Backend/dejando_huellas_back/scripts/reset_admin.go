// +build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"dejando_huellas_back/internal/config"
	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	ctx := context.Background()

	cfg := config.Load()

	fmt.Println("===========================================")
	fmt.Println("  Dejando Huellas - Admin Reset Tool")
	fmt.Println("===========================================")
	fmt.Println()

	// Read admin credentials from environment (must be set)
	adminEmail := os.Getenv("ADMIN_EMAIL")
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	adminName := os.Getenv("ADMIN_NAME")

	if adminEmail == "" || adminPassword == "" {
		fmt.Println("ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env or environment variables.")
		fmt.Println()
		fmt.Println("Usage:")
		fmt.Println("  $env:ADMIN_EMAIL=\"admin@example.com\"")
		fmt.Println("  $env:ADMIN_PASSWORD=\"your-secure-password\"")
		fmt.Println("  $env:ADMIN_NAME=\"Administrator\"")
		fmt.Println("  go run scripts/reset_admin.go")
		os.Exit(1)
	}
	if adminName == "" {
		adminName = "Administrator"
	}

	userRepo := repository.NewUserRepository(ctx, cfg.MongoURI, cfg.Database)

	// Check if admin exists
	exists, err := userRepo.ExistsByEmail(ctx, adminEmail)
	if err != nil {
		log.Fatalf("Error checking admin existence: %v", err)
	}

	if exists {
		// Update existing admin
		user, err := userRepo.GetByEmail(ctx, adminEmail)
		if err != nil {
			log.Fatalf("Error getting admin user: %v", err)
		}

		// Update password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Error hashing password: %v", err)
		}

		user.Password = string(hashedPassword)
		user.Role = domain.RoleAdmin
		user.Status = domain.StatusApproved

		if err := userRepo.Update(ctx, user.ID, user); err != nil {
			log.Fatalf("Error updating admin user: %v", err)
		}

		fmt.Printf("✓ Admin user '%s' updated successfully!\n", adminEmail)
	} else {
		// Create new admin
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Error hashing password: %v", err)
		}

		admin := &domain.User{
			Name:     adminName,
			Email:    adminEmail,
			Password: string(hashedPassword),
			Role:     domain.RoleAdmin,
			Status:   domain.StatusApproved,
		}

		if err := userRepo.Create(ctx, admin); err != nil {
			log.Fatalf("Error creating admin user: %v", err)
		}

		fmt.Printf("✓ Admin user '%s' created successfully!\n", adminEmail)
	}

	fmt.Println()
	fmt.Println("Admin Credentials:")
	fmt.Printf("  Email:    %s\n", adminEmail)
	fmt.Printf("  Password: %s\n", adminPassword)
	fmt.Println()
	fmt.Println("You can now login with these credentials.")
}
