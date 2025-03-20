import {Component, inject, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {AssetService} from '../services/asset.service';

interface FileItem {
  name: string;
  size: string;
  uploadDate: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HomeComponent implements OnInit {

  private router = inject(Router);
  private assetService = inject(AssetService);


  // Dashboard stats
  totalFiles: number = 0;
  storageUsed: string = '0 MB';
  lastUploadDate: string = '-';

  // Recent files
  recentFiles: FileItem[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // Navigate to upload page or open upload dialog
  uploadNewFile(): void {
    this.router.navigate(['/upload']);
  }

  // Navigate to files page
  viewAllFiles(): void {
    this.router.navigate(['/files']);
  }

  // You can add methods to fetch data from your backend
  private loadDashboardData(): void {
    console.log('Loading dashboard data...');
    this.assetService.getAllAssets().subscribe(assets => {
      if (assets && assets.length > 0) {
        // Update total files count
        this.totalFiles = assets.length;

        // Calculate total storage used
        const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0);
        this.storageUsed = this.assetService.formatFileSize(totalBytes);

        // Find the most recent upload date
        const sortedAssets = [...assets].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (sortedAssets.length > 0) {
          const latestAsset = sortedAssets[0];
          this.lastUploadDate = new Date(latestAsset.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }

        // Get recent files (up to 4)
        this.recentFiles = sortedAssets.slice(0, 4).map(asset => ({
          name: asset.name,
          size: this.assetService.formatFileSize(asset.size),
          uploadDate: new Date(asset.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        }));
      }
    });
  }

}
