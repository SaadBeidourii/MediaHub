export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
    path: string;
  }
  
  export interface FolderCreateRequest {
    name: string;
    parentId?: string;
  }
  
  export interface FolderResponse {
    folder: Folder;
    status: string;
  }
  
  export interface FoldersListResponse {
    folders: Folder[];
  }
  
  export interface FolderContentsResponse {
    assets: any[];
    subFolders: Folder[];
  }
  
  export interface MoveFolderRequest {
    folderId: string;
    targetFolderId: string | null;
  }

  export interface FolderContentsResponse {
    subFolders: Folder[];
    assets: any[];
  }

  export interface FolderNode extends Folder {
    children: FolderNode[];
    level: number;
  }