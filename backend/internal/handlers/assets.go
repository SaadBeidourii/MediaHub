package handlers

import (
	"fmt"
	"net/http"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/SaadBeidourii/MediaHub.git/pkg/validator"
	"github.com/gin-gonic/gin"
)


type AssetHandler struct {
	assetService  *services.AssetService
	mediaHandlers map[models.AssetType]MediaTypeHandler
}

type MediaTypeHandler interface {
	ValidateFile(fileHeader *gin.Context) error
	HandleUpload(c *gin.Context, assetService *services.AssetService) (*models.Asset, error)
}


func NewAssetHandler(assetService *services.AssetService) *AssetHandler {
	handler := &AssetHandler{
		assetService:  assetService,
		mediaHandlers: make(map[models.AssetType]MediaTypeHandler),
	}
	handler.mediaHandlers[models.AssetTypePDF] = NewPDFHandler()
	handler.mediaHandlers[models.AssetTypeEPUB] = NewEPUBHandler()

	return handler
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

// HandleUpload is a generic upload handler for any media type
func (h *AssetHandler) HandleUpload(c *gin.Context, assetType models.AssetType) {
	mediaHandler, exists := h.mediaHandlers[assetType]
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Unsupported media type: %s", assetType),
		})
		return
	}

	_, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No file provided or invalid file",
		})
		return
	}

	asset, err := mediaHandler.HandleUpload(c, h.assetService)
	if err != nil {
		errorStatusCode := http.StatusInternalServerError
		errorMessage := "Failed to process file: " + err.Error()

		switch err {
		case validator.ErrFileTooLarge:
			errorStatusCode = http.StatusRequestEntityTooLarge
			errorMessage = "File too large. Maximum size exceeded."
		case validator.ErrInvalidFileType:
			errorStatusCode = http.StatusBadRequest
			errorMessage = fmt.Sprintf("Invalid file type. Only %s files are allowed.", assetType)
		case validator.ErrEmptyFile:
			errorStatusCode = http.StatusBadRequest
			errorMessage = "Empty file"
		}

		c.JSON(errorStatusCode, gin.H{
			"error": errorMessage,
		})
		return
	}

	// Return success response
	c.JSON(http.StatusCreated, models.AssetResponse{
		Asset:  asset,
		Status: "success",
	})
}

// UploadPDF handles POST /api/assets/pdf
func (h *AssetHandler) UploadPDF(c *gin.Context) {
	h.HandleUpload(c, models.AssetTypePDF)
}

// UploadEPUB handles POST /api/assets/epub
func (h *AssetHandler) UploadEPUB(c *gin.Context) {
	h.HandleUpload(c, models.AssetTypeEPUB)
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
