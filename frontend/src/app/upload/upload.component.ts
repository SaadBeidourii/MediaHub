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
  // UI state variables
  isDragOver = false;
  isUploading = false;
  uploadComplete = false;
  uploadError = false;
  uploadProgress = 0;
  errorMessage = '';
  uploadedFileId = '';
  
  selectedFileType: 'pdf' | 'epub' | 'audio' = 'pdf';
  
  fileTypeExtensions = {
    'pdf': ['.pdf'],
    'epub': ['.epub'],
    'audio': ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.webm']
  };
  
  // Maximum file sizes (in bytes)
  maxFileSizes = {
    'pdf': 10 * 1024 * 1024,
    'epub': 20 * 1024 * 1024,
    'audio': 10 * 1024 * 1024 
  };

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;


  private router = inject(Router);
  private assetService = inject(AssetService);

  // Check if running in browser
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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
  onFileTypeChange(type: 'pdf' | 'epub'| 'audio'): void {
    this.selectedFileType = type;
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.resetUpload();
  }

  // Process the selected file
  private processFile(file: File): void {
    this.resetUpload();
    
    const fileExt = this.getFileExtension(file.name).toLowerCase();
    const allowedExts = this.fileTypeExtensions[this.selectedFileType];
    
    if (!allowedExts.includes(fileExt)) {
      this.showError(`Only ${this.selectedFileType.toUpperCase()} files are allowed`);
      return;
    }

    const maxSize = this.maxFileSizes[this.selectedFileType];
    if (file.size > maxSize) {
      this.showError(`File size exceeds the maximum limit of ${this.formatFileSize(maxSize)}`);
      return;
    }

    this.uploadFile(file);
  }
  
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
  }
  
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;
  
    let uploadObservable;

    switch (this.selectedFileType) {
      case 'pdf':
        uploadObservable = this.assetService.uploadPdfFile(file);
        break;
      case 'epub':
        uploadObservable = this.assetService.uploadEpubFile(file);
        break;
      case 'audio':
        uploadObservable = this.assetService.uploadAudioFile(file);
        break;
      default:
        this.showError('Unsupported file type.');
        this.isUploading = false;
        return;
    }
  
    uploadObservable.pipe(
      tap(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          const response = event.body;
          if (response?.asset?.id) {
            this.uploadedFileId = response.asset.id;
            setTimeout(() => {
              this.isUploading = false;
              this.uploadComplete = true;
            }, 500);
          }
        }
      }),
      catchError(error => {
        console.error('Upload error:', error);
        let message = 'An error occurred during upload';
  
        if (error.error?.error) {
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

  getUploadIconClass(): string {
    switch (this.selectedFileType) {
      case 'pdf':
        return 'pdf-upload-icon';
      case 'epub':
        return 'epub-upload-icon';
      case 'audio':
        return 'audio-upload-icon';
      default:
        return 'default-upload-icon';
    }
  }

  getMAxSize(){
    return this.maxFileSizes[this.selectedFileType] / (1024 * 1024) + ' MB';
  }

  getAcceptedMimeTypes(): string {
    switch (this.selectedFileType) {
      case 'pdf':
        return 'application/pdf';
      case 'epub':
        return 'application/epub+zip,.epub';
      case 'audio':
        return [
          'audio/mpeg',
          'audio/mp3',
          'audio/mp4',
          'audio/wav',
          'audio/x-wav',
          'audio/vnd.wave',
          'audio/ogg',
          'audio/flac',
          'audio/x-flac',
          'audio/aac',
          'audio/x-m4a',
          'audio/webm'
        ].join(',');
      default:
        return '';
    }
  }
  
  
}