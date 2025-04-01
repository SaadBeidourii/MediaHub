package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/SaadBeidourii/MediaHub.git/internal/config"
	"github.com/SaadBeidourii/MediaHub.git/internal/handlers"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/SaadBeidourii/MediaHub.git/internal/storage"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// Load configuration
	cfg := config.NewConfig()

	// Initialize database connection
	dbConnString := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User,
		cfg.Database.Password, cfg.Database.Name, cfg.Database.SSLMode,
	)

	db, err := sql.Open("postgres", dbConnString)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Successfully connected to PostgreSQL database")

	// Initialize the PostgreSQL asset store for metadata
	assetStore, err := storage.NewPostgresAssetStore(db)
	if err != nil {
		log.Fatalf("Failed to initialize PostgreSQL asset store: %v", err)
	}

	folderStore, err := storage.NewPostgresFolderStore(db)
	if err != nil {
		log.Fatalf("Failed to initialize PostgreSQL folder store: %v", err)
	}

	// Initialize the PostgreSQL storage provider for file content
	storageProvider, err := storage.NewPostgresStorageProvider(db)
	if err != nil {
		log.Fatalf("Failed to initialize PostgreSQL storage provider: %v", err)
	}

	// Initialize services
	assetService := services.NewAssetService(storageProvider, assetStore)
	folderService := services.NewFolderService(folderStore, assetStore)

	// Initialize handlers
	assetHandler := handlers.NewAssetHandler(assetService)
	folderHandler := handlers.NewFolderHandler(folderService)

	// Initialize Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowOrigins,
		AllowMethods:     cfg.CORS.AllowMethods,
		AllowHeaders:     cfg.CORS.AllowHeaders,
		ExposeHeaders:    cfg.CORS.ExposeHeaders,
		AllowCredentials: cfg.CORS.AllowCredentials,
		MaxAge:           12 * time.Hour,
	}))

	// Set maximum multipart memory for file uploads (32MB)
	router.MaxMultipartMemory = 32 << 20

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "MediaHub API",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API routes group
	api := router.Group("/api")
	{
		// Assets endpoints
		assets := api.Group("/assets")
		{
			// List all assets
			assets.GET("/", assetHandler.ListAssets)

			// Upload a new PDF asset
			assets.POST("/pdf", assetHandler.UploadPDF)

			// Upload a new EPUB asset
			assets.POST("/epub", assetHandler.UploadEPUB)

			// Upload a new audio asset
			assets.POST("/audio", assetHandler.UploadAudio)

			// Get asset details
			assets.GET("/:id", assetHandler.GetAsset)

			// Download asset
			assets.GET("/:id/download", assetHandler.DownloadAsset)

			// Delete asset
			assets.DELETE("/:id", assetHandler.DeleteAsset)

			// Move asset to folder
			assets.PUT("/:id/move", folderHandler.MoveAsset)
		}

		folders := api.Group("/folders")
		{
			// Create a new folder
			folders.POST("/", folderHandler.CreateFolder)

			// Get all folders
			folders.GET("/", folderHandler.GetAllFolders)

			// Get folder details
			folders.GET("/:id", folderHandler.GetFolder)

			// Get folder contents (assets)
			folders.GET("/:id/contents", folderHandler.GetFolderContents)

			// Update folder
			folders.PUT("/:id", folderHandler.UpdateFolder)

			// Delete folder
			folders.DELETE("/:id", folderHandler.DeleteFolder)

			// Get folder path
			folders.GET("/:id/path", folderHandler.GetFolderPath)
		}
	}

	// Start the server
	serverAddr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("Starting MediaHub API server on %s", serverAddr)
	if err := router.Run(serverAddr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
