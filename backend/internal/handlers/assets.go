package handlers

import (
	"fmt"
	"net/http"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/SaadBeidourii/MediaHub.git/pkg/validator"
	"github.com/gin-gonic/gin"
)

// AssetHandler handles HTTP requests for assets
type AssetHandler struct {
	assetService *services.AssetService
}

// NewAssetHandler creates a new AssetHandler
func NewAssetHandler(assetService *services.AssetService) *AssetHandler {
	return &AssetHandler{
		assetService: assetService,
	}
}

// ListAssets handles GET /api/assets
func (h *AssetHandler) ListAssets(c *gin.Context) {
	// In a real application, you would fetch assets from a database
	// For simplicity, we're returning an empty array
	c.JSON(http.StatusOK, gin.H{
		"assets": []models.Asset{},
	})
}

// UploadPDF handles POST /api/assets/pdf
func (h *AssetHandler) UploadPDF(c *gin.Context) {
	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file provided",
		})
		return
	}

	// Validate the file
	if err := validator.ValidatePDFFile(file); err != nil {
		var statusCode int
		var message string

		switch err {
		case validator.ErrFileTooLarge:
			statusCode = http.StatusRequestEntityTooLarge
			message = fmt.Sprintf("File too large. Maximum size allowed is %d bytes", validator.MaxPDFSize)
		case validator.ErrInvalidFileType:
			statusCode = http.StatusBadRequest
			message = "Invalid file type. Only PDF files are allowed"
		case validator.ErrEmptyFile:
			statusCode = http.StatusBadRequest
			message = "Empty file"
		default:
			statusCode = http.StatusInternalServerError
			message = "Error validating file"
		}

		c.JSON(statusCode, gin.H{
			"error": message,
		})
		return
	}

	// Create the asset
	asset, err := h.assetService.CreatePDFAsset(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process file",
		})
		return
	}

	// Return success response
	c.JSON(http.StatusCreated, models.AssetResponse{
		Asset:  asset,
		Status: "success",
	})
}

// GetAsset handles GET /api/assets/:id
func (h *AssetHandler) GetAsset(c *gin.Context) {
	// Get the asset ID from the URL
	assetID := c.Param("id")

	// Get the asset
	asset, err := h.assetService.GetAsset(assetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Asset not found",
		})
		return
	}

	// Return the asset
	c.JSON(http.StatusOK, asset)
}

// DownloadAsset handles GET /api/assets/:id/download
func (h *AssetHandler) DownloadAsset(c *gin.Context) {
	// Get the asset ID from the URL
	assetID := c.Param("id")

	// Get the asset
	asset, err := h.assetService.GetAsset(assetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Asset not found",
		})
		return
	}

	// Set the content disposition header for downloading
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", asset.Name))
	c.Header("Content-Type", asset.ContentType)

	// TODO: Stream the file content here
	c.String(http.StatusOK, "File content would be streamed here")
}

// DeleteAsset handles DELETE /api/assets/:id
func (h *AssetHandler) DeleteAsset(c *gin.Context) {
	// Get the asset ID from the URL
	assetID := c.Param("id")

	// Delete the asset
	if err := h.assetService.DeleteAsset(assetID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete asset",
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Asset deleted successfully",
	})
}
