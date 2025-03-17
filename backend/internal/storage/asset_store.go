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
}
