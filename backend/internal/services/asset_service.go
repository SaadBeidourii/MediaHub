package services

import (
	"fmt"
	"mime/multipart"
	"path/filepath"
	"time"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/storage"
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

// CreatePDFAsset handles creating a new PDF asset
func (s *AssetService) CreatePDFAsset(fileHeader *multipart.FileHeader) (*models.Asset, error) {
	// Open the uploaded file
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open uploaded file: %w", err)
	}
	defer file.Close()

	// Generate a unique ID for the asset
	assetID := uuid.New().String()

	// Create a new asset
	now := time.Now()
	asset := &models.Asset{
		ID:          assetID,
		Name:        fileHeader.Filename,
		Type:        models.AssetTypePDF,
		Size:        fileHeader.Size,
		ContentType: fileHeader.Header.Get("Content-Type"),
		CreatedAt:   now,
		UpdatedAt:   now,
		Metadata:    make(map[string]interface{}),
	}

	// Add file extension to metadata
	asset.Metadata["extension"] = filepath.Ext(fileHeader.Filename)

	// Save the file using the storage provider
	path, err := s.storage.Save(file, asset)
	if err != nil {
		return nil, fmt.Errorf("failed to save file: %w", err)
	}

	// Update the asset with the storage path
	asset.Path = path

	// Save the asset to the asset store
	if err := s.assetStore.Save(asset); err != nil {
		return nil, fmt.Errorf("failed to save asset metadata: %w", err)
	}

	return asset, nil
}

// GetAsset retrieves an asset by ID
func (s *AssetService) GetAsset(assetID string) (*models.Asset, error) {
	// Get the asset from the asset store
	asset, err := s.assetStore.GetByID(assetID)
	if err != nil {
		return nil, err
	}

	// Check if the file exists in storage
	_, err = s.storage.Get(assetID)
	if err != nil {
		// If the file doesn't exist but we have metadata, we should clean up
		s.assetStore.Delete(assetID)
		return nil, fmt.Errorf("asset file not found: %w", err)
	}

	return asset, nil
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
