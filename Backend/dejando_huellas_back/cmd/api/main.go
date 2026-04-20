package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"dejando_huellas_back/internal/config"
	"dejando_huellas_back/internal/middleware"
	"dejando_huellas_back/internal/repository"
	"dejando_huellas_back/internal/service"
	"dejando_huellas_back/internal/usecase"

	httpdelivery "dejando_huellas_back/internal/delivery/http"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Println("Initializing Dejando Huellas API...")

	userRepo := repository.NewUserRepository(ctx, cfg.MongoURI, cfg.Database)
	postRepo := repository.NewPostRepository(ctx, cfg.MongoURI, cfg.Database)
	contactRepo := repository.NewContactRepository(ctx, cfg.MongoURI, cfg.Database)
	messageRepo := repository.NewMessageRepository(ctx, cfg.MongoURI, cfg.Database)
	communityRepo := repository.NewCommunityRepository(ctx, cfg.MongoURI, cfg.Database)
	habeasDataRepo := repository.NewHabeasDataRepository(ctx, cfg.MongoURI, cfg.Database)
	chatBotRepo := repository.NewChatBotRepository(ctx, cfg.MongoURI, cfg.Database)

	if err := userRepo.EnsureIndexes(); err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
	}
	if err := postRepo.EnsureIndexes(); err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
	}
	if err := messageRepo.EnsureIndexes(); err != nil {
		log.Printf("Warning: Failed to create message indexes: %v", err)
	}
	if err := communityRepo.EnsureIndexes(); err != nil {
		log.Printf("Warning: Failed to create community indexes: %v", err)
	}
	if err := habeasDataRepo.EnsureIndexes(); err != nil {
		log.Printf("Warning: Failed to create habeas data indexes: %v", err)
	}
	if err := chatBotRepo.EnsureIndexes(); err != nil {
		log.Printf("Warning: Failed to create chatbot indexes: %v", err)
	}

	// Initialize default admin user
	if err := config.InitializeAdmin(ctx, userRepo, config.DefaultInitData()); err != nil {
		log.Printf("Warning: Failed to initialize admin user: %v", err)
	}

	userUC := usecase.NewUserUseCase(userRepo)
	authUC := usecase.NewAuthUseCase(userRepo)

	// Set JWT secret for authentication
	authUC.SetJWTSecret(cfg.JWTSecret)

	postUC := usecase.NewPostUseCase(postRepo)
	contactUC := usecase.NewContactUseCase(contactRepo)
	messageUC := usecase.NewMessageUseCase(messageRepo, userRepo)
	communityUC := usecase.NewCommunityUseCase(communityRepo)
	habeasDataUC := usecase.NewHabeasDataUseCase(habeasDataRepo)
	chatBotUC := usecase.NewChatBotUseCase(chatBotRepo)

	// Initialize image uploader if GitHub token is configured
	var postHandler *httpdelivery.PostHandler
	var imageUploader *service.ImageUploader

	if cfg.GitHubToken != "" && cfg.GitHubToken != "your_github_personal_access_token" {
		log.Println("Initializing GitHub image uploader...")
		imageUploader = service.NewImageUploader(
			cfg.GitHubOwner,
			cfg.GitHubRepo,
			cfg.GitHubBranch,
			cfg.GitHubToken,
			cfg.GitHubImagesPath,
		)
		postHandler = httpdelivery.NewPostHandlerWithImageUploader(postUC, imageUploader, cfg.MaxImageUploads)
		log.Printf("Image uploader configured for repository: %s/%s (branch: %s) path: %s", cfg.GitHubOwner, cfg.GitHubRepo, cfg.GitHubBranch, cfg.GitHubImagesPath)
	} else {
		log.Println("WARNING: GitHub token not configured. Image upload is disabled.")
		log.Println("Please add GITHUB_TOKEN to your .env file to enable image uploads.")
		postHandler = httpdelivery.NewPostHandler(postUC)
	}

	userHandler := httpdelivery.NewUserHandler(userUC)
	authHandler := httpdelivery.NewAuthHandler(authUC)
	contactHandler := httpdelivery.NewContactHandler(contactUC)
	messageHandler := httpdelivery.NewMessageHandler(messageUC)
	communityHandler := httpdelivery.NewCommunityHandler(communityUC)
	habeasDataHandler := httpdelivery.NewHabeasDataHandler(habeasDataUC)
	chatBotHandler := httpdelivery.NewChatBotHandler(chatBotUC)

	router := gin.Default()
	router.Use(middleware.CORS())

	authMw := middleware.NewAuthMiddleware(cfg.JWTSecret)
	roleMw := middleware.NewRoleMiddleware()

	httpdelivery.SetupRoutes(cfg, router, authHandler, userHandler, postHandler, contactHandler, messageHandler, communityHandler, habeasDataHandler, chatBotHandler, authMw, roleMw)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
