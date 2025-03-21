package models

import (
	"errors"
	"time"
)

var (
	ErrAssetNotFound = errors.New("asset not found")
)

// AssetType defines the type of asset
type AssetType string

const (
	// AssetTypePDF represents a PDF document
	AssetTypePDF AssetType = "pdf"
)

// Asset represents a media file in the system
type Asset struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Type        AssetType `json:"type"`
	Size        int64     `json:"size"`
	ContentType string    `json:"contentType"`
	Path        string    `json:"-"` // Private field, not exposed via API
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
	FolderID    *string   `json:"folderId,omitempty"`
}

// AssetCreateRequest represents the request to create a new asset
type AssetCreateRequest struct {
	Name string `json:"name" form:"name" binding:"required"`
}

// AssetResponse represents the response after asset creation
type AssetResponse struct {
	Asset  *Asset `json:"asset"`
	Status string `json:"status"`
}
