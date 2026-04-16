package http

import (
	"dejando_huellas_back/internal/config"
	"dejando_huellas_back/internal/middleware"
	"strings"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	cfg *config.Config,
	router *gin.Engine,
	authHandler *AuthHandler,
	userHandler *UserHandler,
	postHandler *PostHandler,
	contactHandler *ContactHandler,
	messageHandler *MessageHandler,
	authMw *middleware.AuthMiddleware,
	roleMw *middleware.RoleMiddleware,
) {
	router.GET(cfg.BasePath+"/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "API is healthy"})
	})

	// Apply base path if configured
	// BasePath can include /api/v1 (e.g., "dejando_huellas/api/v1") or not (e.g., "dejando_huellas")
	apiPath := "api/v1"
	if cfg.BasePath != "" {
		// Remove any leading slashes from base path
		basePath := cfg.BasePath
		if len(basePath) > 0 && basePath[0] == '/' {
			basePath = basePath[1:]
		}

		// If basePath already contains "api/v1", use it as-is; otherwise append it
		if strings.Contains(basePath, "api/v1") {
			apiPath = basePath
		} else {
			apiPath = basePath + "/api/v1"
		}
	}

	api := router.Group("/" + apiPath)
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login)
			auth.GET("/me", authMw.Authenticate(), authHandler.Me)
		}

		members := api.Group("/members")
		{
			members.POST("/register", userHandler.RegisterMember)

			members.GET("", authMw.Authenticate(), roleMw.RequireAdmin(), userHandler.GetAll)
			members.GET("/:id", authMw.Authenticate(), roleMw.RequireAdmin(), userHandler.GetByID)
			members.PUT("/:id", authMw.Authenticate(), roleMw.RequireAdmin(), userHandler.Update)
			members.DELETE("/:id", authMw.Authenticate(), roleMw.RequireAdmin(), userHandler.Delete)
			members.POST("/:id/approve", authMw.Authenticate(), roleMw.RequireAdmin(), userHandler.Approve)
			members.POST("/:id/reject", authMw.Authenticate(), roleMw.RequireAdmin(), userHandler.Reject)
		}

		posts := api.Group("/posts")
		{
			posts.GET("", postHandler.GetAll)

			// IMPORTANT: These specific routes must be defined BEFORE the /:id wildcard route
			// Multipart endpoint for creating posts with images
			posts.POST("/with-images", authMw.Authenticate(), roleMw.RequireMember(), postHandler.CreateWithImages)
			// Multipart endpoint for updating posts with images
			posts.PUT("/:id/with-images", authMw.Authenticate(), roleMw.RequireAdmin(), postHandler.UpdateWithImages)

			// Wildcard routes - defined last to avoid conflicts
			posts.GET("/:id", postHandler.GetByID)

			// JSON endpoint for creating posts (without images)
			posts.POST("", authMw.Authenticate(), roleMw.RequireMember(), postHandler.Create)
			// JSON endpoint for updating posts (without images)
			posts.PUT("/:id", authMw.Authenticate(), roleMw.RequireAdmin(), postHandler.Update)
			// Delete post
			posts.DELETE("/:id", authMw.Authenticate(), roleMw.RequireAdmin(), postHandler.Delete)
		}

		contact := api.Group("/contact")
		{
			contact.POST("", contactHandler.Create)
			contact.GET("", authMw.Authenticate(), roleMw.RequireAdmin(), contactHandler.GetAll)
		}

		// Messages (Group Chat) - accessible to all authenticated non-admin users
		messages := api.Group("/messages")
		{
			// Get all messages (any authenticated member, but NOT admin)
			messages.GET("", authMw.Authenticate(), roleMw.RequireMember(), messageHandler.GetAll)
			// Get new messages since timestamp (any authenticated member, but NOT admin)
			messages.GET("/since", authMw.Authenticate(), roleMw.RequireMember(), messageHandler.GetSince)
			// Post new message (any authenticated member, but NOT admin)
			messages.POST("", authMw.Authenticate(), roleMw.RequireMember(), messageHandler.Create)
			// IMPORTANT: Delete ALL messages must be defined BEFORE /:id to avoid conflicts
			// Clear all messages (admin only)
			messages.DELETE("", authMw.Authenticate(), roleMw.RequireAdmin(), messageHandler.DeleteAll)
			// Update a message (only by author)
			messages.PUT("/:id", authMw.Authenticate(), roleMw.RequireMember(), messageHandler.Update)
			// Delete a message (only by author)
			messages.DELETE("/:id", authMw.Authenticate(), roleMw.RequireMember(), messageHandler.Delete)
			// Add reaction to a message (any authenticated member)
			messages.POST("/:id/reactions", authMw.Authenticate(), roleMw.RequireMember(), messageHandler.AddReaction)
		}
	}
}
