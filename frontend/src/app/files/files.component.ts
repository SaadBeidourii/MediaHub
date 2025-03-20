import { Component, OnInit, inject, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService, Asset } from '../services/asset.service';

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  contentType: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FilesComponent implements OnInit {
  // Inject dependencies
  private router = inject(Router);
  private assetService = inject(AssetService);

  // Inject PLATFORM_ID to check if we're in browser
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // View mode (grid or list)
  viewMode: 'grid' | 'list' = 'grid';

  // Search
  searchQuery: string = '';

  // Files arrays
  allFiles: FileItem[] = [];
  filteredFiles: FileItem[] = [];

  // Delete modal
  showDeleteModal: boolean = false;
  fileToDelete: FileItem | null = null;

  ngOnInit(): void {
    // Only access localStorage in the browser
    if (this.isBrowser) {
      const savedViewMode = localStorage.getItem('filesViewMode');
      if (savedViewMode === 'grid' || savedViewMode === 'list') {
        this.viewMode = savedViewMode;
      }
    }

    // Load files from API
    this.loadFiles();
  }

  loadFiles(): void {
    this.assetService.getAllAssets().subscribe({
      next: (assets) => {
        this.allFiles = assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          size: this.assetService.formatFileSize(asset.size),
          uploadDate: new Date(asset.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          contentType: asset.contentType
        }));

        this.filterFiles();
      },
      error: (error) => {
        console.error('Error loading files:', error);
        // You could add error handling UI here
      }
    });
  }

  // Set view mode (grid or list)
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;

    // Only access localStorage in the browser
    if (this.isBrowser) {
      localStorage.setItem('filesViewMode', mode);
    }
  }

  // Filter files based on search query
  filterFiles(): void {
    if (!this.searchQuery) {
      this.filteredFiles = [...this.allFiles];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredFiles = this.allFiles.filter(file =>
      file.name.toLowerCase().includes(query)
    );
  }

  // Navigate to upload page
  navigateToUpload(): void {
    this.router.navigate(['/upload']);
  }

  // Delete file confirmation
  confirmDelete(file: FileItem): void {
    this.fileToDelete = file;
    this.showDeleteModal = true;
  }

  // Cancel delete
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.fileToDelete = null;
  }

  // Delete file
  deleteFile(): void {
    if (!this.fileToDelete) return;

    this.assetService.deleteAsset(this.fileToDelete.id).subscribe({
      next: () => {
        this.allFiles = this.allFiles.filter(file => file.id !== this.fileToDelete!.id);
        this.filterFiles();
        this.showDeleteModal = false;
        this.fileToDelete = null;
      },
      error: (error) => {
        console.error('Error deleting file:', error);
        // You could add error handling UI here
        this.showDeleteModal = false;
        this.fileToDelete = null;
      }
    });
  }

  // View file
  viewFile(file: FileItem): void {
    // Only proceed in browser environment
    if (!this.isBrowser) return;

    this.assetService.downloadAsset(file.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  // Download file
  downloadFile(file: FileItem): void {
    // Only proceed in browser environment
    if (!this.isBrowser) return;

    this.assetService.downloadAsset(file.id).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    });
  }
}
