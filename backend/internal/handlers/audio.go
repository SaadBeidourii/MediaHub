package handlers

import (
	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/SaadBeidourii/MediaHub.git/pkg/validator"
	"github.com/gin-gonic/gin"
)

type AudioHandler struct{}

func NewAudioHandler() *AudioHandler {
	return &AudioHandler{}
}

// ValidateFile validates if the file is a valid audio file
func (h *AudioHandler) ValidateFile(c *gin.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return err
	}

	return validator.ValidateAudioFile(file)
}

func (h *AudioHandler) HandleUpload(c *gin.Context, assetService *services.AssetService) (*models.Asset, error) {
	file, err := c.FormFile("file")
	if err != nil {
		return nil, err
	}

	if err := validator.ValidateAudioFile(file); err != nil {
		return nil, err
	}

	return assetService.CreateAudioAsset(file)
}
