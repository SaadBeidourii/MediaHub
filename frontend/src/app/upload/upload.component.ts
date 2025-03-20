import { Component, ElementRef, ViewChild, inject, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HttpEventType, HttpClientModule } from '@angular/common/http';
import { catchError, finalize, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AssetService } from '../services/asset.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule]
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

  // Maximum file size in bytes (10MB)
  private maxFileSize = 10 * 1024 * 1024;

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

  // Process the selected file
  private processFile(file: File): void {
    // Reset previous states
    this.resetUpload();

    // Validate file type
    if (file.type !== 'application/pdf') {
      this.showError('Only PDF files are allowed');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.showError('File size exceeds the maximum limit of 10MB');
      return;
    }

    // Upload the file
    this.uploadFile(file);
  }

  // Upload file to server
  private uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;

    this.assetService.uploadPdfFile(file).pipe(
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
      this.router.navigate(['/files']);
    }
  }

  // Upload another file
  uploadAnother(): void {
    this.resetUpload();
  }
}
