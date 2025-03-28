package services

import (
	"fmt"
	"time"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/storage"
	"github.com/google/uuid"
)

// FolderService handles operations on folders
type FolderService struct {
	folderStore storage.FolderStore
	assetStore  storage.AssetStore
}

// NewFolderService creates a new FolderService
func NewFolderService(folderStore storage.FolderStore, assetStore storage.AssetStore) *FolderService {
	return &FolderService{
		folderStore: folderStore,
		assetStore:  assetStore,
	}
}

// CreateFolder creates a new folder
func (s *FolderService) CreateFolder(request *models.FolderCreateRequest) (*models.Folder, error) {
	if request.ParentID != nil {
		_, err := s.folderStore.GetByID(*request.ParentID)
		if err != nil {
			return nil, err
		}
	}

	// Create the folder
	now := time.Now()
	folder := &models.Folder{
		ID:          uuid.New().String(),
		Name:        request.Name,
		Description: request.Description,
		ParentID:    request.ParentID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Save the folder
	if err := s.folderStore.Save(folder); err != nil {
		return nil, err
	}

	return folder, nil
}

// GetFolder retrieves a folder by ID
func (s *FolderService) GetFolder(folderID string) (*models.Folder, error) {
	return s.folderStore.GetByID(folderID)
}

// GetAllFolders retrieves all folders
func (s *FolderService) GetAllFolders() ([]*models.Folder, error) {
	return s.folderStore.GetAll()
}

// GetFoldersByParent retrieves folders by parent ID
func (s *FolderService) GetFoldersByParent(parentID *string) ([]*models.Folder, error) {
	return s.folderStore.GetByParentID(parentID)
}

// UpdateFolder updates a folder
func (s *FolderService) UpdateFolder(folderID string, request *models.FolderUpdateRequest) (*models.Folder, error) {
	// Get the existing folder
	folder, err := s.folderStore.GetByID(folderID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if request.Name != nil {
		folder.Name = *request.Name
	}
	if request.Description != nil {
		folder.Description = *request.Description
	}
	if request.ParentID != nil {
		if *request.ParentID == folderID {
			return nil, models.ErrFolderCannotBeItsOwnParent
		}

		if *request.ParentID != "" {
			if err := s.checkForCyclicReference(folderID, *request.ParentID); err != nil {
				return nil, err
			}
		}

		folder.ParentID = request.ParentID
	}

	folder.UpdatedAt = time.Now()

	// Save the updated folder
	if err := s.folderStore.Update(folder); err != nil {
		return nil, err
	}

	return folder, nil
}

// Helper method to check for cyclic references
func (s *FolderService) checkForCyclicReference(folderID, potentialParentID string) error {
	currentID := potentialParentID

	for {
		parent, err := s.folderStore.GetByID(currentID)
		if err != nil {
			if err == models.ErrFolderNotFound {
				return nil
			}
			return err
		}

		// If parent ID is nil, we've reached the root without finding a cycle
		if parent.ParentID == nil {
			return nil
		}

		// If this parent points back to our original folder, we have a cycle
		if *parent.ParentID == folderID {
			return models.ErrCyclicReferenceDetected
		}

		// Move up the chain
		currentID = *parent.ParentID
	}
}

// DeleteFolder deletes a folder and optionally its contents
func (s *FolderService) DeleteFolder(folderID string) error {
	return s.folderStore.Delete(folderID)
}

// MoveAsset moves an asset to a different folder
func (s *FolderService) MoveAsset(assetID string, folderID *string) error {
	// Verify asset exists
	_, err := s.assetStore.GetByID(assetID)
	if err != nil {
		return err
	}

	// Verify folder exists if not null
	if folderID != nil {
		_, err := s.folderStore.GetByID(*folderID)
		if err != nil {
			return err
		}
	}

	// Move the asset
	return s.assetStore.MoveAsset(assetID, folderID)
}

// GetFolderContents retrieves all assets in a folder
func (s *FolderService) GetFolderContents(folderID *string) (*models.FolderContents, error) {
	// If folder ID is provided, verify it exists
	if folderID != nil {
		_, err := s.folderStore.GetByID(*folderID)
		if err != nil {
			return nil, err
		}
	}

	// Get assets in the folder
	assets, err := s.assetStore.GetByFolderID(folderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get assets: %w", err)
	}

	// Get subfolders in the folder
	subfolders, err := s.folderStore.GetByParentID(folderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subfolders: %w", err)
	}

	// Return combined results
	return &models.FolderContents{
		Assets:     assets,
		SubFolders: subfolders,
	}, nil
}

// GetFolderPath retrieves the path from a folder to the root
func (s *FolderService) GetFolderPath(folderID string) ([]*models.Folder, error) {
	var path []*models.Folder
	currentID := folderID

	for {
		folder, err := s.folderStore.GetByID(currentID)
		if err != nil {
			return nil, err
		}

		path = append([]*models.Folder{folder}, path...)

		if folder.ParentID == nil {
			break
		}
		currentID = *folder.ParentID
	}

	return path, nil
}
