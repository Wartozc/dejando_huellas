package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"dejando_huellas_back/internal/domain"
	"dejando_huellas_back/internal/usecase"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestRoleMiddleware_RequireAdmin(t *testing.T) {
	t.Run("should allow admin role", func(t *testing.T) {
		router := setupTestRouter()
		roleMw := NewRoleMiddleware()

		router.GET("/admin", func(c *gin.Context) {
			c.Set("role", string(domain.RoleAdmin))
			roleMw.RequireAdmin()(c)
		}, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/admin", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("should reject non-admin role", func(t *testing.T) {
		router := setupTestRouter()
		roleMw := NewRoleMiddleware()

		router.GET("/admin", func(c *gin.Context) {
			c.Set("role", string(domain.RoleMember))
			roleMw.RequireAdmin()(c)
		}, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/admin", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})
}

func TestRoleMiddleware_RequireRole(t *testing.T) {
	t.Run("should allow specified roles", func(t *testing.T) {
		router := setupTestRouter()
		roleMw := NewRoleMiddleware()

		router.GET("/member", func(c *gin.Context) {
			c.Set("role", string(domain.RoleMember))
			roleMw.RequireRole("ADMIN", "MEMBER")(c)
		}, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/member", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("should reject unspecified roles", func(t *testing.T) {
		router := setupTestRouter()
		roleMw := NewRoleMiddleware()

		router.GET("/admin-only", func(c *gin.Context) {
			c.Set("role", string(domain.RoleMember))
			roleMw.RequireRole("ADMIN")(c)
		}, func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/admin-only", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusForbidden, w.Code)
	})
}

func TestAuthMiddleware_Authenticate(t *testing.T) {
	t.Run("should reject request without authorization header", func(t *testing.T) {
		router := setupTestRouter()
		authMw := NewAuthMiddleware("test-secret")

		router.GET("/protected", authMw.Authenticate(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/protected", nil)
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("should reject request with invalid header format", func(t *testing.T) {
		router := setupTestRouter()
		authMw := NewAuthMiddleware("test-secret")

		router.GET("/protected", authMw.Authenticate(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"message": "success"})
		})

		w := httptest.NewRecorder()
		req, _ := http.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "InvalidFormat")
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("should accept valid token", func(t *testing.T) {
		router := setupTestRouter()
		secret := "test-secret"
		authMw := NewAuthMiddleware(secret)

		authUC := &usecase.AuthUseCase{}
		authUC.SetJWTSecret(secret)

		authMw.SetAuthUseCase(authUC)

		router.GET("/protected", authMw.Authenticate(), func(c *gin.Context) {
			userID, _ := c.Get("user_id")
			email, _ := c.Get("email")
			role, _ := c.Get("role")
			c.JSON(http.StatusOK, gin.H{
				"user_id": userID,
				"email":   email,
				"role":    role,
			})
		})
	})
}
