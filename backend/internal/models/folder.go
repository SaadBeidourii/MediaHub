package models

import (
	"errors"
	"time"
)

var (
	ErrFolderNotFound             = errors.New("folder not found")
	ErrFolderCannotBeItsOwnParent = errors.New("a folder cannot be its own parent")
	ErrCyclicReferenceDetected    = errors.New("cyclic reference detected - folder would be its own ancestor")
)

type Folder struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	ParentID    *string   `json:"parentId,omitempty"` // Nullable for root folders
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type FolderCreateRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	ParentID    *string `json:"parentId"`
}

type FolderUpdateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	ParentID    *string `json:"parentId"`
}

type FolderContents struct {
	Assets     []*Asset  `json:"assets"`
	SubFolders []*Folder `json:"subFolders"`
}

type AssetMoveRequest struct {
	FolderID *string `json:"folderId"` // Null means move to root
}
