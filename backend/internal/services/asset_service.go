package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/storage"
	"github.com/SaadBeidourii/MediaHub.git/pkg/validator"
	"github.com/google/uuid"
)

// AssetService handles operations on assets
type AssetService struct {
	storage    storage.StorageProvider
	assetStore storage.AssetStore
}

// NewAssetService creates a new AssetService
func NewAssetService(storageProvider storage.StorageProvider, assetStore storage.AssetStore) *AssetService {
	return &AssetService{
		storage:    storageProvider,
		assetStore: assetStore,
	}
}

// ////////////////// * ASSET CREATION * /////////////////////////
func (s *AssetService) CreateAsset(fileHeader *multipart.FileHeader, assetType models.AssetType) (*models.Asset, error) {
	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	assetID := uuid.New().String()

	// Create a new asset
	now := time.Now()
	asset := &models.Asset{
		ID:          assetID,
		Name:        fileHeader.Filename,
		Type:        assetType,
		Size:        fileHeader.Size,
		ContentType: fileHeader.Header.Get("Content-Type"),
		CreatedAt:   now,
		UpdatedAt:   now,
		Metadata:    make(map[string]interface{}),
		Path:        fmt.Sprintf("db://%s", assetID),
	}

	// Add file extension to metadata
	asset.Metadata["extension"] = filepath.Ext(fileHeader.Filename)

	// FIRST: Save the asset metadata to the database
	if err := s.assetStore.Save(asset); err != nil {
		return nil, fmt.Errorf("failed to save asset metadata: %w", err)
	}

	// THEN: Save the file content
	_, err = s.storage.Save(file, asset)
	if err != nil {
		// If file save fails, clean up the asset metadata
		s.assetStore.Delete(assetID)
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	return asset, nil
}

//////////////////// * PDF * /////////////////////////

// CreatePDFAsset creates a PDF asset
func (s *AssetService) CreatePDFAsset(fileHeader *multipart.FileHeader) (*models.Asset, error) {
	if err := validator.ValidateAudioFile(fileHeader); err != nil {
		return nil, err
	}
	return s.CreateAsset(fileHeader, models.AssetTypePDF)
}

//////////////////// * EPUB * /////////////////////////

// CreateEPUBAsset creates an EPUB asset
func (s *AssetService) CreateEPUBAsset(fileHeader *multipart.FileHeader) (*models.Asset, error) {
	if err := validator.ValidateEPUBFile(fileHeader); err != nil {
		return nil, err
	}
	return s.CreateAsset(fileHeader, models.AssetTypeEPUB)
}

//////////////////// * AUDIO * /////////////////////////

// CreateAudioAsset creates an audio asset
func (s *AssetService) CreateAudioAsset(fileHeader *multipart.FileHeader) (*models.Asset, error) {
	if err := validator.ValidateAudioFile(fileHeader); err != nil {
		return nil, err
	}
	return s.CreateAsset(fileHeader, models.AssetTypeAUDIO)
}

//////////////////// * CORE * /////////////////////////

// GetAsset retrieves an asset by ID
func (s *AssetService) GetAsset(assetID string) (*models.Asset, error) {
	// Get the asset from the asset store
	asset, err := s.assetStore.GetByID(assetID)
	if err != nil {
		return nil, err
	}

	return asset, nil
}

// GetAssetContent retrieves the content of an asset by ID
func (s *AssetService) GetAssetContent(assetID string) (io.ReadCloser, error) {
	// Check if the asset exists
	_, err := s.assetStore.GetByID(assetID)
	if err != nil {
		return nil, err
	}

	// Get the file content from storage
	content, err := s.storage.Get(assetID)
	if err != nil {
		return nil, fmt.Errorf("failed to get asset content: %w", err)
	}

	return content, nil
}

// GetAllAssets retrieves all assets
func (s *AssetService) GetAllAssets() ([]*models.Asset, error) {
	return s.assetStore.GetAll()
}

// DeleteAsset removes an asset by ID
func (s *AssetService) DeleteAsset(assetID string) error {
	// First check if the asset exists
	_, err := s.assetStore.GetByID(assetID)
	if err != nil {
		return err
	}

	// Delete the file using the storage provider
	if err := s.storage.Delete(assetID); err != nil {
		return fmt.Errorf("failed to delete asset file: %w", err)
	}

	// Remove the asset from the asset store
	if err := s.assetStore.Delete(assetID); err != nil {
		return fmt.Errorf("failed to delete asset metadata: %w", err)
	}

	return nil
}
