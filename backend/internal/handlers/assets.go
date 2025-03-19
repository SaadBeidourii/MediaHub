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
	// Get all assets from the service
	assets, err := h.assetService.GetAllAssets()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve assets",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"assets": assets,
	})
}

// UploadPDF handles POST /api/assets/pdf
func (h *AssetHandler) UploadPDF(c *gin.Context) {
	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file provided or invalid file",
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
			message = "Error validating file: " + err.Error()
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
			"error": "Failed to process file: " + err.Error(),
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

	// Get the asset metadata
	asset, err := h.assetService.GetAsset(assetID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Asset not found",
		})
		return
	}

	// Get the file content from storage
	fileContent, err := h.assetService.GetAssetContent(assetID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve asset content",
		})
		return
	}
	defer fileContent.Close()

	// Set appropriate headers for download
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", asset.Name))
	c.Header("Content-Type", asset.ContentType)
	c.Header("Content-Length", fmt.Sprintf("%d", asset.Size))

	// Stream the file content to the client
	c.DataFromReader(http.StatusOK, asset.Size, asset.ContentType, fileContent, nil)
}

// DeleteAsset handles DELETE /api/assets/:id
func (h *AssetHandler) DeleteAsset(c *gin.Context) {
	// Get the asset ID from the URL
	assetID := c.Param("id")

	// Delete the asset
	if err := h.assetService.DeleteAsset(assetID); err != nil {
		if err == models.ErrAssetNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Asset not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete asset: " + err.Error(),
		})
		return
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Asset deleted successfully",
	})
}
