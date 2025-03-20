import { Component, OnInit, inject, PLATFORM_ID, Inject,ViewChild, AfterViewInit,ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetService, Asset } from '../services/asset.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
export class FilesComponent implements OnInit, AfterViewInit{
  // Inject dependencies
  private router = inject(Router);
  private assetService = inject(AssetService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('pdfViewer') pdfViewer: ElementRef<HTMLIFrameElement> | undefined;

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

  // Download & Delete modal
  showDownloadModal: boolean = false;
  showDeleteModal: boolean = false;
  fileToDownload: FileItem | null = null;
  fileToDelete: FileItem | null = null;

  showDownloadSuccess: boolean = false;
  downloadedFileName: string = '';

  // PDF Viewer modal
  showPdfViewer: boolean = false;
  currentPdfUrl: SafeResourceUrl | null = null;
  currentPdfName: string = '';
  currentPdfFile: FileItem | null = null;
  isLoadingPdf: boolean = false;

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

  ngAfterViewInit(): void {
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

  // Downlad file confirmation
  confirmDownload(file: FileItem): void {
    this.fileToDownload = file;
    console.log('Downloading file:', file.name);
    this.showDownloadModal = true;
  
  }

  cancelDownload(): void {
    this.showDownloadModal = false;
    this.fileToDownload = null;
  }

  downloadFile(): void {
    console.log('Downloading file inside the method downloadFile:', this.fileToDownload?.name);
    console.log('Id:', this.fileToDownload?.id);
    
    // Only proceed in browser environment and if file is selected
    if (!this.isBrowser || !this.fileToDownload) return;
    
    // Store a local reference to the file
    const fileToDownload = this.fileToDownload;

    this.assetService.downloadAsset(fileToDownload.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileToDownload.name; // Use the local reference instead
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
    if (!this.isBrowser) return;
    
    this.isLoadingPdf = true;
    this.currentPdfFile = file;
    this.currentPdfName = file.name;
    this.showPdfViewer = true;

    this.assetService.downloadAsset(file.id).subscribe({
      next: (blob) => {
        // Create object URL from blob
        const url = window.URL.createObjectURL(blob);
        this.currentPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.isLoadingPdf = false;
      },
      error: (error) => {
        console.error('Error loading PDF:', error);
        this.isLoadingPdf = false;
        this.closePdfViewer();
      }
    });
  }

  closePdfViewer(): void {
    if (this.currentPdfUrl && typeof this.currentPdfUrl === 'string') {
      URL.revokeObjectURL(this.currentPdfUrl);
    }
    this.showPdfViewer = false;
    this.currentPdfUrl = null;
    this.currentPdfName = '';
    this.currentPdfFile = null;
  }

  // Download the currently viewed PDF
  downloadCurrentPdf(): void {
    if (!this.currentPdfFile) return;
    this.confirmDownload(this.currentPdfFile);
  }
}
