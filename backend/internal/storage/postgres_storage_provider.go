package storage

import (
	"database/sql"
	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)

// PostgresStorageProvider implements StorageProvider with PostgreSQL storage
type PostgresStorageProvider struct {
	db *sql.DB
}

// NewPostgresStorageProvider creates a new PostgresStorageProvider
func NewPostgresStorageProvider(db *sql.DB) (*PostgresStorageProvider, error) {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS file_contents (
			asset_id VARCHAR(36) PRIMARY KEY,
			content BYTEA NOT NULL,
			FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to create file_contents table: %w", err)
	}

	return &PostgresStorageProvider{
		db: db,
	}, nil
}

// Save stores a file in the PostgreSQL database
func (ps *PostgresStorageProvider) Save(file multipart.File, asset *models.Asset) (string, error) {
	// Read file content
	content, err := io.ReadAll(file)
	if err != nil {
		return "", fmt.Errorf("failed to read file content: %w", err)
	}

	// Insert file content into the database
	_, err = ps.db.Exec(
		`INSERT INTO file_contents (asset_id, content) VALUES ($1, $2)`,
		asset.ID, content,
	)
	if err != nil {
		return "", fmt.Errorf("failed to insert file content: %w", err)
	}

	// Return a reference path (not actually used for file access)
	return fmt.Sprintf("db://%s", asset.ID), nil
}

// Get retrieves a file from the PostgreSQL database
func (ps *PostgresStorageProvider) Get(assetID string) (io.ReadCloser, error) {
	var content []byte
	err := ps.db.QueryRow(
		`SELECT content FROM file_contents WHERE asset_id = $1`,
		assetID,
	).Scan(&content)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("file content not found for asset: %s", assetID)
	} else if err != nil {
		return nil, fmt.Errorf("failed to get file content: %w", err)
	}

	// Create an in-memory reader from the content
	return io.NopCloser(strings.NewReader(string(content))), nil
}

// Delete removes a file from the PostgreSQL database
func (ps *PostgresStorageProvider) Delete(assetID string) error {
	result, err := ps.db.Exec(
		`DELETE FROM file_contents WHERE asset_id = $1`,
		assetID,
	)
	if err != nil {
		return fmt.Errorf("failed to delete file content: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("file content not found for asset: %s", assetID)
	}

	return nil
}
