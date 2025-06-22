package handlers

import (
	"fmt"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/SaadBeidourii/MediaHub.git/pkg/validator"
	"github.com/gin-gonic/gin"
)

type PDFHandler struct{}

func NewPDFHandler() *PDFHandler {
	return &PDFHandler{}
}

func (h *PDFHandler) ValidateFile(c *gin.Context) error {
	file, err := c.FormFile("file")
	if err != nil {
		return err
	}

	return validator.ValidatePDFFile(file)
}

// HandleUpload processes a PDF upload request
func (h *PDFHandler) HandleUpload(c *gin.Context, assetService *services.AssetService) (*models.Asset, error) {
	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		return nil, err
	}
	fmt.Printf("Received file: %s\n", file.Filename)

	// Validate the file
	if err := validator.ValidatePDFFile(file); err != nil {
		fmt.Printf("File validation failed: %v\n", err)
		return nil, err
	}
	fmt.Printf("File validation passed: %s\n", file.Filename)

	// Create the PDF asset
	return assetService.CreatePDFAsset(file)
}
