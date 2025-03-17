package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize the Gin router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:4200"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
			assets.GET("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "List assets endpoint",
				})
			})
			assets.POST("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "Upload asset endpoint",
				})
			})
			assets.GET("/:id", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "Get asset details endpoint",
					"id":      c.Param("id"),
				})
			})
		}

		// Collections endpoints
		collections := api.Group("/collections")
		{
			collections.GET("/", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "List collections endpoint",
				})
			})
		}
	}

	// Start the server
	log.Println("Starting MediaHub API server on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
