package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)

// PostgresAssetStore implements AssetStore with PostgreSQL storage
type PostgresAssetStore struct {
	db *sql.DB
}

// NewPostgresAssetStore creates a new PostgresAssetStore
func NewPostgresAssetStore(db *sql.DB) (*PostgresAssetStore, error) {
	// Create the assets table if it doesn't exist
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS assets (
			id VARCHAR(36) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			size BIGINT NOT NULL,
			content_type VARCHAR(100) NOT NULL,
			path TEXT NOT NULL,
			folder_id VARCHAR(36),
			created_at TIMESTAMP WITH TIME ZONE NOT NULL,
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
			metadata JSONB
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to create assets table: %w", err)
	}

	return &PostgresAssetStore{
		db: db,
	}, nil
}

// Save stores asset metadata in PostgreSQL
func (s *PostgresAssetStore) Save(asset *models.Asset) error {
	// Convert metadata to JSON
	metadataJSON, err := json.Marshal(asset.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	// Insert asset into database
	_, err = s.db.Exec(
		`INSERT INTO assets 
		(id, name, type, size, content_type, path, folder_id, created_at, updated_at, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		asset.ID,
		asset.Name,
		asset.Type,
		asset.Size,
		asset.ContentType,
		asset.Path,
		asset.FolderID,
		asset.CreatedAt,
		asset.UpdatedAt,
		metadataJSON,
	)
	if err != nil {
		return fmt.Errorf("failed to insert asset: %w", err)
	}

	return nil
}

// GetByID retrieves an asset by its ID
func (s *PostgresAssetStore) GetByID(id string) (*models.Asset, error) {
	var asset models.Asset
	var metadataJSON []byte

	err := s.db.QueryRow(
		`SELECT 
			id, name, type, size, content_type, path, folder_id, created_at, updated_at, metadata
		FROM assets 
		WHERE id = $1`,
		id,
	).Scan(
		&asset.ID,
		&asset.Name,
		&asset.Type,
		&asset.Size,
		&asset.ContentType,
		&asset.Path,
		&asset.FolderID,
		&asset.CreatedAt,
		&asset.UpdatedAt,
		&metadataJSON,
	)

	if err == sql.ErrNoRows {
		return nil, models.ErrAssetNotFound
	} else if err != nil {
		return nil, fmt.Errorf("failed to get asset: %w", err)
	}

	// Unmarshal metadata
	if metadataJSON != nil {
		if err := json.Unmarshal(metadataJSON, &asset.Metadata); err != nil {
			return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
		}
	} else {
		asset.Metadata = make(map[string]interface{})
	}

	return &asset, nil
}

// GetAll retrieves all assets
func (s *PostgresAssetStore) GetAll() ([]*models.Asset, error) {
	rows, err := s.db.Query(
		`SELECT 
			id, name, type, size, content_type, path, folder_id, created_at, updated_at, metadata
		FROM assets
		ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query assets: %w", err)
	}
	defer rows.Close()

	var assets []*models.Asset

	for rows.Next() {
		var asset models.Asset
		var metadataJSON []byte

		err := rows.Scan(
			&asset.ID,
			&asset.Name,
			&asset.Type,
			&asset.Size,
			&asset.ContentType,
			&asset.Path,
			&asset.FolderID,
			&asset.CreatedAt,
			&asset.UpdatedAt,
			&metadataJSON,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan asset row: %w", err)
		}

		// Unmarshal metadata
		if metadataJSON != nil {
			if err := json.Unmarshal(metadataJSON, &asset.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
			}
		} else {
			asset.Metadata = make(map[string]interface{})
		}

		assets = append(assets, &asset)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating asset rows: %w", err)
	}

	return assets, nil
}

// Delete removes an asset from the store
func (s *PostgresAssetStore) Delete(id string) error {
	result, err := s.db.Exec("DELETE FROM assets WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete asset: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return models.ErrAssetNotFound
	}

	return nil
}

// Update updates an existing asset
func (s *PostgresAssetStore) Update(asset *models.Asset) error {
	// Convert metadata to JSON
	metadataJSON, err := json.Marshal(asset.Metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal metadata: %w", err)
	}

	// Set the updated time
	asset.UpdatedAt = time.Now()

	// Update asset in database
	result, err := s.db.Exec(
		`UPDATE assets 
		SET name = $2, type = $3, size = $4, content_type = $5, path = $6, 
		    folder_id = $7, updated_at = $8, metadata = $9
		WHERE id = $1`,
		asset.ID,
		asset.Name,
		asset.Type,
		asset.Size,
		asset.ContentType,
		asset.Path,
		asset.FolderID,
		asset.UpdatedAt,
		metadataJSON,
	)
	if err != nil {
		return fmt.Errorf("failed to update asset: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return models.ErrAssetNotFound
	}

	return nil
}

// GetByFolderID retrieves all assets in a specific folder
func (s *PostgresAssetStore) GetByFolderID(folderID *string) ([]*models.Asset, error) {
	var query string
	var args []interface{}

	if folderID == nil {
		// Get root assets (where folder_id is NULL)
		query = `
			SELECT 
				id, name, type, size, content_type, path, folder_id, created_at, updated_at, metadata
			FROM assets
			WHERE folder_id IS NULL
			ORDER BY created_at DESC
		`
	} else {
		// Get assets in the specified folder
		query = `
			SELECT 
				id, name, type, size, content_type, path, folder_id, created_at, updated_at, metadata
			FROM assets
			WHERE folder_id = $1
			ORDER BY created_at DESC
		`
		args = append(args, *folderID)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query assets: %w", err)
	}
	defer rows.Close()

	var assets []*models.Asset

	for rows.Next() {
		var asset models.Asset
		var metadataJSON []byte
		var folderIDValue sql.NullString

		err := rows.Scan(
			&asset.ID,
			&asset.Name,
			&asset.Type,
			&asset.Size,
			&asset.ContentType,
			&asset.Path,
			&folderIDValue,
			&asset.CreatedAt,
			&asset.UpdatedAt,
			&metadataJSON,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan asset row: %w", err)
		}

		if folderIDValue.Valid {
			asset.FolderID = &folderIDValue.String
		}

		// Unmarshal metadata
		if metadataJSON != nil {
			if err := json.Unmarshal(metadataJSON, &asset.Metadata); err != nil {
				return nil, fmt.Errorf("failed to unmarshal metadata: %w", err)
			}
		} else {
			asset.Metadata = make(map[string]interface{})
		}

		assets = append(assets, &asset)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating asset rows: %w", err)
	}

	return assets, nil
}

// MoveAsset moves an asset to a different folder
func (s *PostgresAssetStore) MoveAsset(assetID string, folderID *string) error {
	result, err := s.db.Exec(
		`UPDATE assets 
		SET folder_id = $2, updated_at = $3
		WHERE id = $1`,
		assetID,
		folderID,
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("failed to move asset: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return models.ErrAssetNotFound
	}

	return nil
}
