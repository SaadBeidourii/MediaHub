package storage

import (
	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)

// AssetStore is an interface for accessing asset metadata
type AssetStore interface {
	// Save stores asset metadata
	Save(asset *models.Asset) error

	// GetByID retrieves an asset by its ID
	GetByID(id string) (*models.Asset, error)

	// GetAll retrieves all assets
	GetAll() ([]*models.Asset, error)

	// Delete removes an asset from the store
	Delete(id string) error

	// GetByFolderID retrieves all assets in a folder
	GetByFolderID(folderID *string) ([]*models.Asset, error)

	// Move asset to a different folder
	MoveAsset(assetID string, folderID *string) error
}
