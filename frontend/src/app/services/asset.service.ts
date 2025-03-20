import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import {environment} from '../../ environments/environment';

export interface Asset {
  id: string;
  name: string;
  type: string;
  size: number;
  contentType: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

export interface AssetResponse {
  asset: Asset;
  status: string;
}

export interface AssetsListResponse {
  assets: Asset[];
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Get all assets
  getAllAssets(): Observable<Asset[]> {

    return this.http.get<AssetsListResponse>(`${this.apiUrl}/assets`)
      .pipe(
        map(response => response.assets || [])
      );
  }

  // Get asset by ID
  getAssetById(id: string): Observable<Asset> {
    return this.http.get<Asset>(`${this.apiUrl}/assets/${id}`);
  }

  // Upload PDF file
  uploadPdfFile(file: File): Observable<HttpEvent<AssetResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<AssetResponse>(`${this.apiUrl}/assets/pdf`, formData, {
      reportProgress: true,
      observe: 'events'
    });
  }

  // Download asset
  downloadAsset(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/assets/${id}/download`, {
      responseType: 'blob'
    });
  }

  // Delete asset
  deleteAsset(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/assets/${id}`);
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
