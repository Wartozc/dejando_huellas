package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type RoleMiddleware struct{}

func NewRoleMiddleware() *RoleMiddleware {
	return &RoleMiddleware{}
}

func (m *RoleMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		role := strings.ToUpper(userRole.(string))

		for _, allowedRole := range roles {
			if role == strings.ToUpper(allowedRole) {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

func (m *RoleMiddleware) RequireAdmin() gin.HandlerFunc {
	return m.RequireRole("ADMIN")
}

func (m *RoleMiddleware) RequireMember() gin.HandlerFunc {
	return m.RequireRole("ADMIN", "MEMBER")
}
