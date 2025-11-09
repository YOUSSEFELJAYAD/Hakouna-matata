package router

import (
	"github.com/gin-gonic/gin"
	"github.com/hakounamatata/backend-go/internal/delivery/http/middleware"
	"github.com/hakounamatata/backend-go/internal/infrastructure/config"
	"github.com/hakounamatata/backend-go/pkg/logger"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
	"gorm.io/gorm"
)

// NewRouter creates a new router instance with all routes
func NewRouter(
	cfg *config.Config,
	postgresDB *gorm.DB,
	mongoDB *mongo.Client,
	log *logger.Logger,
) *gin.Engine {
	// Set Gin mode
	if cfg.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	// Global middleware
	r.Use(gin.Recovery())
	r.Use(middleware.Logger(log))
	r.Use(middleware.CORS(cfg))
	r.Use(middleware.RateLimit(cfg))
	r.Use(middleware.SecurityHeaders())

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "healthy",
		})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Register endpoint"})
			})
			auth.POST("/login", func(c *gin.Context) {
				c.JSON(200, gin.H{"message": "Login endpoint"})
			})
		}

		// Protected routes (require authentication)
		protected := v1.Group("")
		protected.Use(middleware.AuthMiddleware(cfg))
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", func(c *gin.Context) {
					c.JSON(200, gin.H{"message": "Get current user"})
				})
				users.PUT("/me", func(c *gin.Context) {
					c.JSON(200, gin.H{"message": "Update current user"})
				})
			}

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(middleware.AdminMiddleware())
			{
				admin.GET("/users", func(c *gin.Context) {
					c.JSON(200, gin.H{"message": "Get all users"})
				})
			}
		}
	}

	return r
}
