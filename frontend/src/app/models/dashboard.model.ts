export interface DashboardStats {
  totalFiles: number;
  storageUsed: string;
  lastUploadDate: string;
}

export interface FileItem {
  name: string;
  size: string;
  uploadDate: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentFiles: FileItem[];
}