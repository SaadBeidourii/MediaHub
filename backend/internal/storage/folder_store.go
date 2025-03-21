package storage

import (
	"github.com/SaadBeidourii/MediaHub.git/internal/models"
)


type FolderStore interface {
	Save(folder *models.Folder) error

	GetByID(id string) (*models.Folder, error)

	GetAll() ([]*models.Folder, error)

	GetByParentID(parentID *string) ([]*models.Folder, error)

	Update(folder *models.Folder) error

	Delete(id string) error
}
