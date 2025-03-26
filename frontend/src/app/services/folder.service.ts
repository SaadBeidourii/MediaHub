// frontend/src/app/services/folder.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../ environments/environment';
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
      // For root folder, get folders with parentId=null
      return this.getFoldersByParent("root").pipe(
        map(folders => {
          return {
            subFolders: folders,
            assets: []  // Assets will be loaded separately from the asset service
          };
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
      return of([]);
    }
    
    // Just get the current folder for now, since we don't have path API
    return this.getFolderById(folderId).pipe(
      map(folder => [folder]),
      catchError(error => {
        console.error('Error getting breadcrumb path:', error);
        return throwError(() => error);
      })
    );
  }
}