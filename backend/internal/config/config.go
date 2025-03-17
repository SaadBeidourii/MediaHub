package config

import (
	"os"
	"path/filepath"
)

// Config holds the application configuration
type Config struct {
	// Server configuration
	Server struct {
		Port string
		Host string
	}

	// CORS configuration
	CORS struct {
		AllowOrigins     []string
		AllowMethods     []string
		AllowHeaders     []string
		ExposeHeaders    []string
		AllowCredentials bool
	}

	// Storage configuration
	Storage struct {
		Type     string // "local", "s3", "minio", etc.
		BasePath string // For local storage
	}

	// Database configuration
	Database struct {
		Host     string
		Port     string
		User     string
		Password string
		Name     string
		SSLMode  string
	}
}

// NewConfig creates a new config with default values
func NewConfig() *Config {
	cfg := &Config{}

	// Default server configuration
	cfg.Server.Port = getEnv("SERVER_PORT", "8080")
	cfg.Server.Host = getEnv("SERVER_HOST", "0.0.0.0")

	// Default CORS configuration
	cfg.CORS.AllowOrigins = []string{"http://localhost:4200"} // Angular default port
	cfg.CORS.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	cfg.CORS.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	cfg.CORS.ExposeHeaders = []string{"Content-Length"}
	cfg.CORS.AllowCredentials = true

	// Default storage configuration
	cfg.Storage.Type = getEnv("STORAGE_TYPE", "local")
	cfg.Storage.BasePath = getEnv("STORAGE_PATH", filepath.Join(os.TempDir(), "mediahub", "assets"))

	// Default database configuration
	cfg.Database.Host = getEnv("DB_HOST", "postgres")
	cfg.Database.Port = getEnv("DB_PORT", "5432")
	cfg.Database.User = getEnv("DB_USER", "postgres")
	cfg.Database.Password = getEnv("DB_PASSWORD", "password")
	cfg.Database.Name = getEnv("DB_NAME", "assetvault")
	cfg.Database.SSLMode = getEnv("DB_SSLMODE", "disable")

	return cfg
}

// Helper function to get environment variables with fallback
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
