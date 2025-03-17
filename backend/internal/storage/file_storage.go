package storage

import (
	"io"
	"mime/multipart"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)


type StorageProvider interface {
	// Save stores a file and returns its storage path
	Save(file multipart.File, asset *models.Asset) (string, error)

	// Get retrieves a file by its ID
	Get(assetID string) (io.ReadCloser, error)

	// Delete removes a file from storage
	Delete(assetID string) error
}
