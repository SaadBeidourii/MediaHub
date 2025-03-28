import { Component, ElementRef, ViewChild, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpEventType, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AssetService } from '../services/asset.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule]
})
export class UploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // Use inject pattern for Angular 14+ standalone components
  private router = inject(Router);
  private assetService = inject(AssetService);

  // Check if running in browser
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // UI state variables
  isDragOver = false;
  isUploading = false;
  uploadComplete = false;
  uploadError = false;
  uploadProgress = 0;
  errorMessage = '';
  uploadedFileId = '';
  
  // File type selection
  selectedFileType: 'pdf' | 'epub' = 'pdf';
  
  // Allowed file types map
  fileTypeExtensions = {
    'pdf': ['.pdf'],
    'epub': ['.epub']
  };
  
  // Maximum file sizes (in bytes)
  maxFileSizes = {
    'pdf': 10 * 1024 * 1024, // 10MB
    'epub': 20 * 1024 * 1024 // 20MB 
  };

  // Handle dragover event
  onDragOver(event: DragEvent): void {
    if (!this.isBrowser) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  // Handle dragleave event
  onDragLeave(event: DragEvent): void {
    if (!this.isBrowser) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  // Handle drop event
  onDrop(event: DragEvent): void {
    if (!this.isBrowser) return;

    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processFile(file);
    }
  }

  // Handle file selection from file input
  onFileSelected(event: Event): void {
    if (!this.isBrowser) return;

    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processFile(file);
    }
  }
  
  // Change file type
  onFileTypeChange(type: 'pdf' | 'epub'): void {
    this.selectedFileType = type;
    
    // Reset file input when changing type
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    
    // Reset upload states
    this.resetUpload();
  }

  // Process the selected file
  private processFile(file: File): void {
    // Reset previous states
    this.resetUpload();
    
    // Get file extension
    const fileExt = this.getFileExtension(file.name).toLowerCase();
    const allowedExts = this.fileTypeExtensions[this.selectedFileType];
    
    // Validate file type
    if (!allowedExts.includes(fileExt)) {
      this.showError(`Only ${this.selectedFileType.toUpperCase()} files are allowed`);
      return;
    }

    // Validate file size
    const maxSize = this.maxFileSizes[this.selectedFileType];
    if (file.size > maxSize) {
      this.showError(`File size exceeds the maximum limit of ${this.formatFileSize(maxSize)}`);
      return;
    }

    // Upload the file
    this.uploadFile(file);
  }
  
  // Get file extension (including the dot)
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
  }
  
  // Format file size to human-readable format
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Upload file to server
  private uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;

    // Use the appropriate upload method based on file type
    const uploadObservable = this.selectedFileType === 'pdf' ? 
      this.assetService.uploadPdfFile(file) :
      this.assetService.uploadEpubFile(file);

    uploadObservable.pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          // Successfully uploaded
          const response = event.body;
          if (response && response.asset && response.asset.id) {
            this.uploadedFileId = response.asset.id;
            setTimeout(() => {
              this.isUploading = false;
              this.uploadComplete = true;
            }, 500); // Small delay for better UX
          }
        }
      }),
      catchError(error => {
        console.error('Upload error:', error);
        let message = 'An error occurred during upload';

        if (error.error && error.error.error) {
          message = error.error.error;
        } else if (error.statusText) {
          message = `Error: ${error.statusText}`;
        }

        this.showError(message);
        return of(null);
      }),
      finalize(() => {
        if (!this.uploadComplete && !this.uploadError) {
          this.isUploading = false;
        }
      })
    ).subscribe();
  }

  // Display error message
  private showError(message: string): void {
    this.uploadError = true;
    this.errorMessage = message;
    this.isUploading = false;
    this.uploadComplete = false;
  }

  // Reset upload state
  resetUpload(): void {
    this.isUploading = false;
    this.uploadComplete = false;
    this.uploadError = false;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.uploadedFileId = '';

    // Reset file input
    if (this.isBrowser && this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Navigate to the uploaded file
  viewFile(): void {
    if (this.uploadedFileId) {
      this.router.navigate(['/explorer']);
    }
  }

  // Upload another file
  uploadAnother(): void {
    this.resetUpload();
  }
}