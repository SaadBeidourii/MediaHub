// frontend/src/app/services/asset.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../ environments/environment';
import { 
  Asset, 
  AssetResponse, 
  AssetsListResponse,
  MoveAssetRequest
} from '../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;


  // Upload PDF file
  uploadPdfFile(file: File, folderId?: string): Observable<HttpEvent<AssetResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (folderId) {
      formData.append('folderId', folderId);
    }

    return this.http.post<AssetResponse>(`${this.apiUrl}/assets/pdf`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(() => error);
      })
    );
  }

  // Upload EPUB file
  uploadEpubFile(file: File, folderId?: string): Observable<HttpEvent<AssetResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (folderId) {
      formData.append('folderId', folderId);
    }

    return this.http.post<AssetResponse>(`${this.apiUrl}/assets/epub`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      catchError(error => {
        console.error('Error uploading file:', error);
        return throwError(() => error);
      })
    );
  }

  // Get all assets
  getAllAssets(): Observable<Asset[]> {
    return this.http.get<AssetsListResponse>(`${this.apiUrl}/assets`)
      .pipe(
        map(response => response.assets || []),
        catchError(error => {
          console.error('Error fetching assets:', error);
          return throwError(() => error);
        })
      );
  }

  // Get assets in a specific folder
  getAssetsByFolder(folderId: string | null): Observable<Asset[]> {
    // For all assets, then filter client-side
    return this.http.get<AssetsListResponse>(`${this.apiUrl}/assets`)
      .pipe(
        map(response => {
          const assets = response.assets || [];
          
          if (folderId === null) {
            // For root: return only assets without a folderId
            return assets.filter(asset => !asset.folderId);
          } else {
            // For specific folder: return only assets with matching folderId
            return assets.filter(asset => asset.folderId === folderId);
          }
        }),
        catchError(error => {
          console.error('Error fetching assets by folder:', error);
          return throwError(() => error);
        })
      );
  }

  // Get asset by ID
  getAssetById(id: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/assets/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching asset by ID:', error);
          return throwError(() => error);
        })
      );
  }

  // Download asset
  downloadAsset(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/assets/${id}/download`, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading asset:', error);
        return throwError(() => error);
      })
    );
  }

  // Delete asset
  deleteAsset(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/assets/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting asset:', error);
          return throwError(() => error);
        })
      );
  }

  // Move asset to folder
  moveAssetToFolder(request: MoveAssetRequest): Observable<any> {
    const url = `${this.apiUrl}/assets/${request.assetId}/move`;
    const payload = { folderId: request.targetFolderId };
    
    return this.http.put(url, payload).pipe(
      catchError(error => {
        console.error('Error moving asset:', error);
        return throwError(() => new Error('Failed to move asset. Please try again.'));
      })
    );
  }

  // Helper method to format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}