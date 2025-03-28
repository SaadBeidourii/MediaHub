package handlers

import (
	"net/http"

	"github.com/SaadBeidourii/MediaHub.git/internal/models"
	"github.com/SaadBeidourii/MediaHub.git/internal/services"
	"github.com/gin-gonic/gin"
)

// FolderHandler handles HTTP requests for folders
type FolderHandler struct {
	folderService *services.FolderService
}

// NewFolderHandler creates a new FolderHandler
func NewFolderHandler(folderService *services.FolderService) *FolderHandler {
	return &FolderHandler{
		folderService: folderService,
	}
}

// CreateFolder handles POST /api/folders
func (h *FolderHandler) CreateFolder(c *gin.Context) {
	var request models.FolderCreateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	folder, err := h.folderService.CreateFolder(&request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create folder: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, folder)
}

// GetFolder handles GET /api/folders/:id
func (h *FolderHandler) GetFolder(c *gin.Context) {
	folderID := c.Param("id")

	folder, err := h.folderService.GetFolder(folderID)
	if err != nil {
		if err == models.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Folder not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get folder: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, folder)
}

// GetAllFolders handles GET /api/folders
func (h *FolderHandler) GetAllFolders(c *gin.Context) {
	// Check if parentId query parameter is provided
	parentID := c.Query("parentId")
	var folders []*models.Folder
	var err error

	if parentID == "root" {
		// Get root folders (null parent)
		folders, err = h.folderService.GetFoldersByParent(nil)
	} else if parentID != "" {
		// Get folders with specific parent
		folders, err = h.folderService.GetFoldersByParent(&parentID)
	} else {
		// Get all folders
		folders, err = h.folderService.GetAllFolders()
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get folders: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"folders": folders,
	})
}

// UpdateFolder handles PUT /api/folders/:id
func (h *FolderHandler) UpdateFolder(c *gin.Context) {
	folderID := c.Param("id")

	var request models.FolderUpdateRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	folder, err := h.folderService.UpdateFolder(folderID, &request)
	if err != nil {
		if err == models.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Folder not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update folder: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, folder)
}

// DeleteFolder handles DELETE /api/folders/:id
func (h *FolderHandler) DeleteFolder(c *gin.Context) {
	folderID := c.Param("id")

	if err := h.folderService.DeleteFolder(folderID); err != nil {
		if err == models.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Folder not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete folder: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Folder deleted successfully",
	})
}

// GetFolderContents handles GET /api/folders/:id/contents
func (h *FolderHandler) GetFolderContents(c *gin.Context) {
	folderID := c.Param("id")

	// For "root" folder, use nil
	var folderIDPtr *string
	if folderID != "root" {
		folderIDPtr = &folderID
	}

	// Get folder contents (both assets and subfolders)
	contents, err := h.folderService.GetFolderContents(folderIDPtr)
	if err != nil {
		if err == models.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Folder not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get folder contents: " + err.Error(),
		})
		return
	}

	// Return the combined contents
	c.JSON(http.StatusOK, contents)
}

// MoveAsset handles PUT /api/assets/:id/move
func (h *FolderHandler) MoveAsset(c *gin.Context) {
	assetID := c.Param("id")

	var request models.AssetMoveRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	if err := h.folderService.MoveAsset(assetID, request.FolderID); err != nil {
		if err == models.ErrAssetNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Asset not found",
			})
			return
		} else if err == models.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Folder not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to move asset: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Asset moved successfully",
	})
}

// GetFolderPath handles GET /api/folders/:id/path
func (h *FolderHandler) GetFolderPath(c *gin.Context) {
	folderID := c.Param("id")

	path, err := h.folderService.GetFolderPath(folderID)
	if err != nil {
		if err == models.ErrFolderNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "Folder not found",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get folder path: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"path": path,
	})
}
