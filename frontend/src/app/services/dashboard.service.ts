import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AssetService } from './asset.service';
import { DashboardData, DashboardStats, FileItem } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private assetService = inject(AssetService);

  getDashboardData(): Observable<DashboardData> {
    return this.assetService.getAllAssets().pipe(
      map(assets => {
        if (!assets || assets.length === 0) {
          return this.getEmptyDashboardData();
        }

        const stats = this.calculateDashboardStats(assets);
        const recentFiles = this.getRecentFiles(assets);

        return { stats, recentFiles };
      })
    );
  }

  private calculateDashboardStats(assets: any[]): DashboardStats {
    const totalFiles = assets.length;
    
    const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);
    const storageUsed = this.assetService.formatFileSize(totalBytes);
    
    const lastUploadDate = this.getLastUploadDate(assets);

    return { totalFiles, storageUsed, lastUploadDate };
  }

  private getRecentFiles(assets: any[], limit: number = 4): FileItem[] {
    const sortedAssets = [...assets].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedAssets.slice(0, limit).map(asset => ({
      name: asset.name,
      size: this.assetService.formatFileSize(asset.size),
      uploadDate: this.formatDate(asset.createdAt)
    }));
  }

  private getLastUploadDate(assets: any[]): string {
    if (assets.length === 0) return '-';

    const sortedAssets = [...assets].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return this.formatDate(sortedAssets[0].createdAt);
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private getEmptyDashboardData(): DashboardData {
    return {
      stats: {
        totalFiles: 0,
        storageUsed: '0 MB',
        lastUploadDate: '-'
      },
      recentFiles: []
    };
  }
}
