package handlers

import (
	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/SaadBeidourii/MediaHub.git/pkg/validator"
	"github.com/gin-gonic/gin"
)

// EPUBHandler handles EPUB-specific operations
type EPUBHandler struct{}

// NewEPUBHandler creates a new EPUBHandler
func NewEPUBHandler() *EPUBHandler {
	return &EPUBHandler{}
}

// ValidateFile validates if the file is a valid EPUB
func (h *EPUBHandler) ValidateFile(c *gin.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return err
	}

	return validator.ValidateEPUBFile(file)
}

// HandleUpload processes an EPUB upload request
func (h *EPUBHandler) HandleUpload(c *gin.Context, assetService *services.AssetService) (*models.Asset, error) {
	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		return nil, err
	}

	// Validate the file
	if err := validator.ValidateEPUBFile(file); err != nil {
		return nil, err
	}

	// Create the EPUB asset
	return assetService.CreateEPUBAsset(file)
}
