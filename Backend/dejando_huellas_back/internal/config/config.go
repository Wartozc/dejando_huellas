package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	BasePath         string
	MongoURI         string
	Database         string
	JWTSecret        string
	GitHubToken      string
	GitHubOwner      string
	GitHubRepo       string
	GitHubBranch     string
	GitHubImagesPath string
	MaxImageUploads  int
	AdminEmail       string
	AdminPassword    string
	AdminName        string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		fmt.Println("Warning: .env file not found, using environment variables")
	}

	return &Config{
		Port:             getEnv("PORT", "8080"),
		BasePath:         getEnv("BASE_PATH", ""),
		MongoURI:         getEnv("MONGO_URI", "mongodb://localhost:27017"),
		Database:         getEnv("DATABASE", "dejando_huellas"),
		JWTSecret:        getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		GitHubToken:      getEnv("GITHUB_TOKEN", ""),
		GitHubOwner:      getEnv("GITHUB_OWNER", "Wartozc"),
		GitHubRepo:       getEnv("GITHUB_REPO", "dejando_huellas"),
		GitHubBranch:     getEnv("GITHUB_BRANCH", "trunk"),
		GitHubImagesPath: getEnv("GITHUB_IMAGES_PATH", "images"),
		MaxImageUploads:  getEnvAsInt("MAX_IMAGE_UPLOADS", 5),
		AdminEmail:       getEnv("ADMIN_EMAIL", ""),
		AdminPassword:    getEnv("ADMIN_PASSWORD", ""),
		AdminName:        getEnv("ADMIN_NAME", "Administrator"),
	}
}

// AdminInitData returns InitData populated from the Config's admin settings
func (cfg *Config) AdminInitData() *InitData {
	return &InitData{
		AdminEmail:    cfg.AdminEmail,
		AdminPassword: cfg.AdminPassword,
		AdminName:     cfg.AdminName,
	}
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		var result int
		if _, err := fmt.Sscanf(value, "%d", &result); err == nil {
			return result
		}
	}
	return defaultValue
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
