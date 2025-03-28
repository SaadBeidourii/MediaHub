// frontend/src/app/services/folder.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError,switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../ environments/environment';
import { AssetService } from './asset.service';
import { 
  Folder, 
  FolderResponse, 
  FoldersListResponse, 
  FolderContentsResponse,
  FolderCreateRequest,
  MoveFolderRequest
} from '../models/folder.model';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private assetService = inject(AssetService);

  // Get all folders
  getAllFolders(): Observable<Folder[]> {
    return this.http.get<FoldersListResponse>(`${this.apiUrl}/folders`)
      .pipe(
        map(response => response.folders || []),
        catchError(error => {
          console.error('Error fetching folders:', error);
          return throwError(() => error);
        })
      );
  }

  // Get folders by parent ID
  getFoldersByParent(parentId: string | null): Observable<Folder[]> {
    let url = `${this.apiUrl}/folders`;
    url += `?parentId=${parentId}`;
    return this.http.get<FoldersListResponse>(url)
      .pipe(
        map(response => response.folders || []),
        catchError(error => {
          console.error('Error fetching folders by parent:', error);
          return throwError(() => error);
        })
      );
  }

  // Get folder by ID
  getFolderById(id: string): Observable<Folder> {
    return this.http.get<Folder>(`${this.apiUrl}/folders/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching folder by ID:', error);
          return throwError(() => error);
        })
      );
  }

  // Get folder contents (assets and subfolders)
  getFolderContents(folderId: string | null): Observable<FolderContentsResponse> {
    if (folderId) {
      // For specific folder, use the contents endpoint
      return this.http.get<FolderContentsResponse>(`${this.apiUrl}/folders/${folderId}/contents`)
        .pipe(
          catchError(error => {
            console.error('Error fetching folder contents:', error);
            return throwError(() => error);
          })
        );
    } else {
      // For root folder, combine folders and assets requests
      return this.getFoldersByParent("root").pipe(
        switchMap(folders => {
          return this.assetService.getAssetsByFolder(null).pipe(
            map(assets => {
              return {
                subFolders: folders,
                assets: assets
              };
            })
          );
        }),
        catchError(error => {
          console.error('Error fetching root contents:', error);
          return throwError(() => error);
        })
      );
    }
  }

  // Create new folder
  createFolder(folderData: FolderCreateRequest): Observable<FolderResponse> {
    return this.http.post<FolderResponse>(`${this.apiUrl}/folders`, folderData)
      .pipe(
        catchError(error => {
          console.error('Error creating folder:', error);
          return throwError(() => error);
        })
      );
  }

  // Update folder (rename)
  updateFolder(folderId: string, name: string): Observable<FolderResponse> {
    return this.http.put<FolderResponse>(`${this.apiUrl}/folders/${folderId}`, { name })
      .pipe(
        catchError(error => {
          console.error('Error updating folder:', error);
          return throwError(() => error);
        })
      );
  }

  // Delete folder
  deleteFolder(folderId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/folders/${folderId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting folder:', error);
          return throwError(() => error);
        })
      );
  }

  // TODO

  // Move folder to another folder
  moveFolder(request: MoveFolderRequest): Observable<any> {
    // This will be implemented when the backend supports it
    console.log('Move folder request:', request);
    
    return of({ 
      success: false, 
      message: 'Folder movement not implemented in backend yet' 
    }).pipe(
      catchError(error => {
        console.error('Error moving folder:', error);
        return throwError(() => error);
      })
    );
  }

  // Get breadcrumb path for a folder
  getBreadcrumbPath(folderId: string | null): Observable<Folder[]> {
    if (!folderId) {
      return of([]); // Empty path for root
    }
    
    return this.getFolderById(folderId).pipe(
      switchMap(folder => {
        if (!folder.parentId) {
          // This is a root-level folder, return just this folder
          return of([folder]);
        }
        
        // Get the parent path recursively, then add this folder
        return this.getBreadcrumbPath(folder.parentId).pipe(
          map(parentPath => [...parentPath, folder])
        );
      }),
      catchError(error => {
        console.error('Error building breadcrumb path:', error);
        return of([]);
      })
    );
  }
}