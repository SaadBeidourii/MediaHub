package storage

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)


type PostgresFolderStore struct {
	db *sql.DB
}

// NewPostgresFolderStore creates a new PostgresFolderStore
func NewPostgresFolderStore(db *sql.DB) (*PostgresFolderStore, error) {
	// Create the folders table if it doesn't exist
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS folders (
			id VARCHAR(36) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			parent_id VARCHAR(36),
			created_at TIMESTAMP WITH TIME ZONE NOT NULL,
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
			FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
		)
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to create folders table: %w", err)
	}

	_, err = db.Exec(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT FROM information_schema.columns 
				WHERE table_name = 'assets' AND column_name = 'folder_id'
			) THEN
				ALTER TABLE assets ADD COLUMN folder_id VARCHAR(36);
				ALTER TABLE assets ADD CONSTRAINT fk_folder_id 
					FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;
			END IF;
		END $$;
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to update assets table: %w", err)
	}

	return &PostgresFolderStore{
		db: db,
	}, nil
}

// Save stores folder metadata in PostgreSQL
func (s *PostgresFolderStore) Save(folder *models.Folder) error {
	_, err := s.db.Exec(
		`INSERT INTO folders 
		(id, name, description, parent_id, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		folder.ID,
		folder.Name,
		folder.Description,
		folder.ParentID,
		folder.CreatedAt,
		folder.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to insert folder: %w", err)
	}

	return nil
}

// GetByID retrieves a folder by its ID
func (s *PostgresFolderStore) GetByID(id string) (*models.Folder, error) {
	var folder models.Folder
	var parentID sql.NullString

	err := s.db.QueryRow(
		`SELECT 
			id, name, description, parent_id, created_at, updated_at
		FROM folders 
		WHERE id = $1`,
		id,
	).Scan(
		&folder.ID,
		&folder.Name,
		&folder.Description,
		&parentID,
		&folder.CreatedAt,
		&folder.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, models.ErrFolderNotFound
	} else if err != nil {
		return nil, fmt.Errorf("failed to get folder: %w", err)
	}

	if parentID.Valid {
		folder.ParentID = &parentID.String
	}

	return &folder, nil
}

// GetAll retrieves all folders
func (s *PostgresFolderStore) GetAll() ([]*models.Folder, error) {
	rows, err := s.db.Query(
		`SELECT 
			id, name, description, parent_id, created_at, updated_at
		FROM folders
		ORDER BY name ASC`,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query folders: %w", err)
	}
	defer rows.Close()

	var folders []*models.Folder

	for rows.Next() {
		var folder models.Folder
		var parentID sql.NullString

		err := rows.Scan(
			&folder.ID,
			&folder.Name,
			&folder.Description,
			&parentID,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan folder row: %w", err)
		}

		if parentID.Valid {
			folder.ParentID = &parentID.String
		}

		folders = append(folders, &folder)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating folder rows: %w", err)
	}

	return folders, nil
}

// GetByParentID retrieves all folders with the specified parent
func (s *PostgresFolderStore) GetByParentID(parentID *string) ([]*models.Folder, error) {
	var rows *sql.Rows
	var err error

	if parentID == nil {
		// Get root folders (where parent_id is NULL)
		rows, err = s.db.Query(
			`SELECT 
				id, name, description, parent_id, created_at, updated_at
			FROM folders
			WHERE parent_id IS NULL
			ORDER BY name ASC`,
		)
	} else {
		// Get folders with the specified parent_id
		rows, err = s.db.Query(
			`SELECT 
				id, name, description, parent_id, created_at, updated_at
			FROM folders
			WHERE parent_id = $1
			ORDER BY name ASC`,
			*parentID,
		)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to query folders by parent_id: %w", err)
	}
	defer rows.Close()

	var folders []*models.Folder

	for rows.Next() {
		var folder models.Folder
		var parentIDValue sql.NullString

		err := rows.Scan(
			&folder.ID,
			&folder.Name,
			&folder.Description,
			&parentIDValue,
			&folder.CreatedAt,
			&folder.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan folder row: %w", err)
		}

		if parentIDValue.Valid {
			folder.ParentID = &parentIDValue.String
		}

		folders = append(folders, &folder)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating folder rows: %w", err)
	}

	return folders, nil
}

// Update updates an existing folder
func (s *PostgresFolderStore) Update(folder *models.Folder) error {
	folder.UpdatedAt = time.Now()

	result, err := s.db.Exec(
		`UPDATE folders 
		SET name = $2, description = $3, parent_id = $4, updated_at = $5
		WHERE id = $1`,
		folder.ID,
		folder.Name,
		folder.Description,
		folder.ParentID,
		folder.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to update folder: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return models.ErrFolderNotFound
	}

	return nil
}

// Delete removes a folder from the store
func (s *PostgresFolderStore) Delete(id string) error {
	result, err := s.db.Exec("DELETE FROM folders WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete folder: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return models.ErrFolderNotFound
	}

	return nil
}
