import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { FolderService } from '../services/folder.service';
import { AssetService } from '../services/asset.service';
import {
  Folder,
  FolderNode,
  FolderContentsResponse,
  FolderCreateRequest,
  MoveFolderRequest
} from '../models/folder.model';
import {
  Asset,
  MoveAssetRequest
} from '../models/asset.model';
import { FileCardComponent } from '../shared/file-card/file-card.component';
import { FolderCardComponent } from '../shared/folder-card/folder-card.component';

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
  styleUrls: ['./file-explorer.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FileCardComponent, FolderCardComponent]
})
export class FileExplorerComponent implements OnInit {
  @ViewChild('pdfViewer') pdfViewer: ElementRef<HTMLIFrameElement> | undefined;

  // Inject dependencies
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private folderService = inject(FolderService);
  private assetService = inject(AssetService);
  private sanitizer = inject(DomSanitizer);

  // Current location state
  currentFolderId: string | null = null;
  viewMode: 'grid' | 'list' = 'grid';

  // Breadcrumb navigation
  breadcrumbs: Folder[] = [];

  // Content data
  folders: Folder[] = [];
  assets: Asset[] = [];

  // Filtered data for search
  filteredFolders: Folder[] = [];
  filteredAssets: Asset[] = [];

  // UI states
  isLoading = true;
  errorMessage = '';
  searchQuery = '';

  // New folder modal
  showNewFolderModal = false;
  newFolderName = '';
  isCreatingFolder = false;

  // Move item modal
  showMoveModal = false;
  itemToMove: { type: 'folder' | 'asset', id: string, name: string } | null = null;
  targetFolderId: string | null = null;
  availableFolders: Folder[] = [];
  hierarchicalFolders: FolderNode[] = [];

  // Delete confirmation modals
  showDeleteFolderModal = false;
  folderToDelete: Folder | null = null;

  showDeleteFileModal = false;
  fileToDelete: Asset | null = null;

  // Download confirmation modal
  showDownloadModal = false;
  fileToDownload: Asset | null = null;
  downloadedFileName = '';
  showDownloadSuccess: boolean = false;

  // PDF Viewer modal
  showPdfViewer: boolean = false;
  currentPdfUrl: SafeResourceUrl | null = null;
  currentPdfName: string = '';
  currentPdfFile: Asset | null = null;
  isLoadingPdf: boolean = false;
  currentPdfRawUrl: string | null = null;

  // EPUB Viewer modal
  showEpubViewer: boolean = false;
  currentEpubFile: Asset | null = null;

  // Audio Viewer modal
  showAudioViewer: boolean = false;
  currentAudioFile: Asset | null = null;

  ngOnInit(): void {
    // Load saved view mode preference
    const savedViewMode = localStorage.getItem('filesViewMode');
    if (savedViewMode === 'grid' || savedViewMode === 'list') {
      this.viewMode = savedViewMode;
    }

    // Listen to route changes to get current folder
    this.route.paramMap.subscribe(params => {
      this.currentFolderId = params.get('id');
      this.loadCurrentContents();
    });
  }

  loadCurrentContents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load folder contents (both subfolders and assets)
    this.folderService.getFolderContents(this.currentFolderId).subscribe({
      next: (response: FolderContentsResponse) => {
        this.folders = response.subFolders || [];
        this.filteredFolders = [...this.folders];
        this.assets = response.assets || [];
        this.filteredAssets = [...this.assets];

        this.loadBreadcrumbs();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading folder contents:', error);
        this.errorMessage = 'Failed to load contents. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Load breadcrumb path
  loadBreadcrumbs(): void {
    if (!this.currentFolderId) {
      this.breadcrumbs = [];
      return;
    }

    this.folderService.getBreadcrumbPath(this.currentFolderId).subscribe({
      next: (path: Folder[]) => {
        this.breadcrumbs = path;
      },
      error: (error) => {
        console.error('Error loading breadcrumbs:', error);
        this.breadcrumbs = [];
      }
    });
  }

  // Set view mode (grid or list)
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('filesViewMode', mode);
  }

  // Search functionality
  onSearch(): void {
    const query = this.searchQuery.toLowerCase();

    if (!query) {
      this.filteredFolders = [...this.folders];
      this.filteredAssets = [...this.assets];
      return;
    }

    this.filteredFolders = this.folders.filter(
      folder => folder.name.toLowerCase().includes(query)
    );

    this.filteredAssets = this.assets.filter(
      asset => asset.name.toLowerCase().includes(query)
    );
  }

  // Navigation methods
  navigateToRoot(): void {
    this.router.navigate(['/explorer']);
  }

  navigateToFolder(folderId: string): void {
    this.router.navigate(['/explorer', folderId]);
  }

  navigateToUpload(): void {
    this.router.navigate(['/upload']);
  }

  // Folder operations
  openNewFolderModal(): void {
    this.newFolderName = '';
    this.showNewFolderModal = true;
  }

  createFolder(): void {
    if (!this.newFolderName.trim()) {
      return;
    }

    this.isCreatingFolder = true;

    const folderRequest: FolderCreateRequest = {
      name: this.newFolderName.trim(),
      parentId: this.currentFolderId || undefined
    };

    this.folderService.createFolder(folderRequest).subscribe({
      next: (response) => {
        this.folders.push(response.folder);
        this.filteredFolders = [...this.folders];
        this.showNewFolderModal = false;
        this.isCreatingFolder = false;
      },
      error: (error) => {
        console.error('Error creating folder:', error);
        this.isCreatingFolder = false;
      }
    });
  }

  confirmDeleteFolder(folder: Folder): void {
    this.folderToDelete = folder;
    this.showDeleteFolderModal = true;
  }

  deleteFolder(): void {
    if (!this.folderToDelete) return;

    this.folderService.deleteFolder(this.folderToDelete.id).subscribe({
      next: () => {
        this.folders = this.folders.filter(f => f.id !== this.folderToDelete!.id);
        this.filteredFolders = this.filteredFolders.filter(f => f.id !== this.folderToDelete!.id);
        this.showDeleteFolderModal = false;
        this.folderToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting folder:', error);
      }
    });
  }

  // File operations
  viewFile(asset: Asset): void {
    const fileType = asset.type?.toLowerCase();

    console.log('Opening file with type:', fileType, asset);

    if (fileType === 'pdf') {
      this.viewPdfFile(asset);
    } else if (fileType === 'epub') {
      this.viewEpubFile(asset);
    } else if (fileType === 'audio') {
      this.viewAudioFile(asset);
    } else if (fileType && (
      fileType.includes('audio') ||
      asset.name.toLowerCase().endsWith('.mp3') ||
      asset.name.toLowerCase().endsWith('.wav') ||
      asset.name.toLowerCase().endsWith('.ogg') ||
      asset.name.toLowerCase().endsWith('.m4a'))) {
      this.viewAudioFile(asset);
    } else {
      this.downloadFile(asset);
    }
  }

  // View PDF file
  viewPdfFile(asset: Asset): void {
    this.isLoadingPdf = true;
    this.currentPdfFile = asset;
    this.currentPdfName = asset.name;
    this.showPdfViewer = true;

    this.assetService.downloadAsset(asset.id).subscribe({
      next: (blob: Blob) => {
        // Make sure we have the right content type
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });

        // Store the raw URL
        this.currentPdfRawUrl = window.URL.createObjectURL(pdfBlob);

        // Create safe URL
        this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.currentPdfRawUrl);

        // Small delay to ensure DOM is ready
        setTimeout(() => {
          this.isLoadingPdf = false;
        }, 100);
      },
      error: (error) => {
        console.error('Error loading PDF:', error);
        this.isLoadingPdf = false;
        this.closePdfViewer();
      }
    });
  }

  // View EPUB file
  viewEpubFile(asset: Asset): void {
    this.currentEpubFile = asset;
    this.showEpubViewer = true;
  }

  // View Audio file
  viewAudioFile(asset: Asset){
    this.currentAudioFile = asset;
    this.showAudioViewer = true;
  }


  // Close PDF viewer
  closePdfViewer(): void {
    // Properly revoke the raw URL
    if (this.currentPdfRawUrl) {
      URL.revokeObjectURL(this.currentPdfRawUrl);
      this.currentPdfRawUrl = null;
    }

    this.showPdfViewer = false;
    this.currentPdfUrl = null;
    this.currentPdfName = '';
    this.currentPdfFile = null;
  }

  // Close EPUB viewer
  closeEpubViewer(): void {
    this.showEpubViewer = false;
    this.currentEpubFile = null;
  }

  // Close Audio viewer
  closeAudioViewer() : void{
    this.showAudioViewer = false;
    this.currentAudioFile = null
  }

  downloadCurrentPdf(): void {
    if (!this.currentPdfFile) return;
    this.confirmDownload(this.currentPdfFile);
  }

  confirmDownload(asset: Asset): void {
    this.fileToDownload = asset;
    this.showDownloadModal = true;
  }

  cancelDownload(): void {
    this.showDownloadModal = false;
    this.fileToDownload = null;
  }

  downloadSelectedFile(): void {
    if (!this.fileToDownload) return;

    // Store a local reference to the file
    const fileToDownload = this.fileToDownload;

    this.assetService.downloadAsset(fileToDownload.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileToDownload.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        // Show success notification
        this.downloadedFileName = fileToDownload.name;
        this.showDownloadSuccess = true;

        // Auto-hide notification after 3 seconds
        setTimeout(() => {
          this.showDownloadSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error downloading file:', error);
      }
    });

    this.showDownloadModal = false;
    this.fileToDownload = null;
  }

  closeDownloadSuccess(): void {
    this.showDownloadSuccess = false;
  }

  confirmDeleteFile(asset: Asset): void {
    this.fileToDelete = asset;
    this.showDeleteFileModal = true;
  }

  cancelDeleteFile(): void {
    this.showDeleteFileModal = false;
    this.fileToDelete = null;
  }

  deleteConfirmedFile(): void {
    if (!this.fileToDelete) return;

    this.assetService.deleteAsset(this.fileToDelete.id).subscribe({
      next: () => {
        this.assets = this.assets.filter(a => a.id !== this.fileToDelete!.id);
        this.filteredAssets = this.filteredAssets.filter(a => a.id !== this.fileToDelete!.id);
        this.showDeleteFileModal = false;
        this.fileToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting file:', error);
      }
    });
  }

  downloadFile(asset: Asset): void {
    this.confirmDownload(asset);
  }

  deleteFile(asset: Asset): void {
    this.confirmDeleteFile(asset);
  }


  buildFolderHierarchy(folders: Folder[]): FolderNode[] {
    const folderMap: Record<string, FolderNode> = {};

    // Initialize the folder nodes with empty children arrays
    folders.forEach(folder => {
      folderMap[folder.id] = {
        ...folder,
        children: [],
        level: 0
      };
    });

    // Root level folders
    const rootFolders: FolderNode[] = [];

    // Organize folders into hierarchy
    folders.forEach(folder => {
      const folderNode = folderMap[folder.id];

      if (!folder.parentId) {
        rootFolders.push(folderNode);
      } else if (folderMap[folder.parentId]) {
        const parent = folderMap[folder.parentId];
        parent.children.push(folderNode);
        folderNode.level = parent.level + 1;
      }
    });
    return rootFolders;
  }


  // Move functionality
  openMoveModal(type: 'folder' | 'asset', id: string, name: string): void {
    this.itemToMove = { type, id, name };
    this.targetFolderId = null;

    // Load available folders for moving
    this.folderService.getAllFolders().subscribe({
      next: (folders: Folder[]) => {
        let filteredFolders = folders;

        if (type === 'folder') {
          filteredFolders = folders.filter(f => f.id !== id);
          this.removeDescendantFolders(filteredFolders, id);
        }

        // Filter out the current folder as target
        if (this.currentFolderId) {
          filteredFolders = filteredFolders.filter(f => f.id !== this.currentFolderId);
        }

        // Build the folder hierarchy for display
        this.hierarchicalFolders = this.buildFolderHierarchy(filteredFolders);
        this.availableFolders = filteredFolders; // Keep flat list for selection

        this.showMoveModal = true;
      },
      error: (error) => {
        console.error('Error loading folders for move operation:', error);
      }
    });
  }

  // Add this helper method to remove all descendants of a folder
  removeDescendantFolders(folders: Folder[], folderId: string): void {
    const children = folders.filter(f => f.parentId === folderId);

    children.forEach(child => {
      const index = folders.findIndex(f => f.id === child.id);
      if (index !== -1) {
        folders.splice(index, 1);
        this.removeDescendantFolders(folders, child.id);
      }
    });
  }

  moveItem(): void {
    if (!this.itemToMove) return;

    if (this.itemToMove.type === 'folder') {
      const moveRequest: MoveFolderRequest = {
        folderId: this.itemToMove.id,
        targetFolderId: this.targetFolderId
      };

      this.folderService.moveFolder(moveRequest).subscribe({
        next: () => {
          // Reload current contents after the move
          this.loadCurrentContents();
          this.showMoveModal = false;
          this.itemToMove = null;
        },
        error: (error) => {
          console.error('Error moving folder:', error);
        }
      });
    } else {
      const moveRequest: MoveAssetRequest = {
        assetId: this.itemToMove.id,
        targetFolderId: this.targetFolderId
      };

      this.assetService.moveAssetToFolder(moveRequest).subscribe({
        next: () => {
          // Reload current contents after the move
          this.loadCurrentContents();
          this.showMoveModal = false;
          this.itemToMove = null;
        },
        error: (error) => {
          console.error('Error moving asset:', error);
        }
      });
    }
  }

  // Modal management
  closeAllModals(): void {
    this.showNewFolderModal = false;
    this.showMoveModal = false;
    this.showDeleteFolderModal = false;
    this.showDeleteFileModal = false;
    this.showDownloadModal = false;
    if (this.showPdfViewer) this.closePdfViewer();
    if (this.showEpubViewer) this.closeEpubViewer();
    if (this.showAudioViewer) this.closeAudioViewer();
  }
}
