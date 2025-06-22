import {Component, inject, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStats, FileItem } from '../../models/dashboard.model';
import { DashboardCardComponent } from "../../component/dashboard-card/dashboard-card.component";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, DashboardCardComponent]
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private dashboardService = inject(DashboardService);

  // Dashboard stats
  dashboardStats: DashboardStats = {
    totalFiles: 0,
    storageUsed: '0 MB',
    lastUploadDate: '-'
  };

  // Recent files
  recentFiles: FileItem[] = [];

  // Loading state
  isLoading = true;

  ngOnInit(): void {
    this.loadDashboardData();
  }

  uploadNewFile(): void {
    this.router.navigate(['/upload']);
  }

  viewAllFiles(): void {
    this.router.navigate(['/explorer']);
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardStats = data.stats;
        this.recentFiles = data.recentFiles;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading = false;
      }
    });
  }

  get totalFiles(): number {
    return this.dashboardStats.totalFiles;
  }

  get storageUsed(): string {
    return this.dashboardStats.storageUsed;
  }

  get lastUploadDate(): string {
    return this.dashboardStats.lastUploadDate;
  }
}