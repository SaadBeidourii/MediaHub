package storage

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)


type LocalStorage struct {
	BasePath string
}

// NewLocalStorage creates a new LocalStorage instance
func NewLocalStorage(basePath string) (*LocalStorage, error) {
	// Create base directory if it doesn't exist
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create storage directory: %w", err)
	}

	return &LocalStorage{
		BasePath: basePath,
	}, nil
}

// Save stores a file in the local filesystem
func (ls *LocalStorage) Save(file multipart.File, asset *models.Asset) (string, error) {
	// Create asset directory
	assetDir := filepath.Join(ls.BasePath, asset.ID)
	if err := os.MkdirAll(assetDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create asset directory: %w", err)
	}

	// Create the file path
	filePath := filepath.Join(assetDir, asset.Name)

	// Create a new file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer dst.Close()

	// Copy the file contents
	if _, err = io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return the relative storage path
	return filePath, nil
}

// Get retrieves a file from the local filesystem
func (ls *LocalStorage) Get(assetID string) (io.ReadCloser, error) {
	// Find the asset directory
	assetDir := filepath.Join(ls.BasePath, assetID)
	
	// Check if the directory exists
	if _, err := os.Stat(assetDir); os.IsNotExist(err) {
		return nil, fmt.Errorf("asset not found: %s", assetID)
	}

	// Get files in the directory
	files, err := os.ReadDir(assetDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read asset directory: %w", err)
	}

	if len(files) == 0 {
		return nil, fmt.Errorf("no files found for asset: %s", assetID)
	}

	// Open the first file (we only expect one file per asset in this implementation)
	filePath := filepath.Join(assetDir, files[0].Name())
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}

	return file, nil
}

// Delete removes a file from the local filesystem
func (ls *LocalStorage) Delete(assetID string) error {
	// Find the asset directory
	assetDir := filepath.Join(ls.BasePath, assetID)
	
	// Check if the directory exists
	if _, err := os.Stat(assetDir); os.IsNotExist(err) {
		return fmt.Errorf("asset not found: %s", assetID)
	}

	// Remove the directory and all its contents
	if err := os.RemoveAll(assetDir); err != nil {
		return fmt.Errorf("failed to delete asset: %w", err)
	}

	return nil
}