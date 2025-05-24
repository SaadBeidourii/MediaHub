export interface FileItem {
    id: string;
    name: string;
    size: string;
    uploadDate: string;
    contentType: string;
}

export interface Asset {
    id: string;
    name: string;
    type: string;
    size: number;
    contentType: string;
    createdAt: string;
    updatedAt: string;
    folderId: string | null;
    metadata?: any;
    url?: string;
}

export interface AssetResponse {
asset: Asset;
status: string;
}

export interface AssetsListResponse {
assets: Asset[];
}

export interface MoveAssetRequest {
    assetId: string;
    targetFolderId: string | null;
}
