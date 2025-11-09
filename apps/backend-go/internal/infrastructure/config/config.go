package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Security SecurityConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	PostgresURL string
	MongoURL    string
}

type JWTConfig struct {
	Secret     string
	Expiration int
}

type SecurityConfig struct {
	RateLimitMax    int
	RateLimitWindow int
	AllowedOrigins  []string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			PostgresURL: getEnv("DATABASE_URL", ""),
			MongoURL:    getEnv("MONGODB_URI", ""),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key"),
			Expiration: 3600 * 24 * 7, // 7 days
		},
		Security: SecurityConfig{
			RateLimitMax:    100,
			RateLimitWindow: 900, // 15 minutes
			AllowedOrigins: []string{
				getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
			},
		},
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
