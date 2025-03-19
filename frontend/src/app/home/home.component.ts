import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  // Dashboard stats
  totalFiles: number = 4;
  storageUsed: string = '11.5 MB';
  lastUploadDate: string = 'Mar 17, 2025';

  // Recent files
  recentFiles: FileItem[] = [
    {
      name: 'sample-document.pdf',
      size: '2.5 MB',
      uploadDate: 'Mar 17, 2025'
    },
    {
      name: 'project-proposal.pdf',
      size: '1.2 MB',
      uploadDate: 'Mar 14, 2025'
    },
    {
      name: 'user-manual.pdf',
      size: '4.7 MB',
      uploadDate: 'Mar 9, 2025'
    },
    {
      name: 'financial-report-2023.pdf',
      size: '3.1 MB',
      uploadDate: 'Mar 4, 2025'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Here you would typically fetch data from a service
    // this.loadDashboardData();
    // this.loadRecentFiles();
  }

  // Navigate to upload page or open upload dialog
  uploadNewFile(): void {
    // You could either navigate to an upload page:
    this.router.navigate(['/upload']);

    // Or trigger a file input dialog:
    // const fileInput = document.createElement('input');
    // fileInput.type = 'file';
    // fileInput.accept = 'application/pdf';
    // fileInput.click();
    // fileInput.onchange = (event) => {
    //   // Handle the file upload here
    //   const target = event.target as HTMLInputElement;
    //   if (target.files && target.files.length > 0) {
    //     // Call your service to upload the file
    //     // this.fileService.uploadFile(target.files[0])
    //   }
    // };
  }

  // Navigate to files page
  viewAllFiles(): void {
    this.router.navigate(['/files']);
  }

  // You can add methods to fetch data from your backend
  private loadDashboardData(): void {
    // Example:
    // this.dashboardService.getStats().subscribe(stats => {
    //   this.totalFiles = stats.totalFiles;
    //   this.storageUsed = stats.storageUsed;
    //   this.lastUploadDate = stats.lastUploadDate;
    // });
  }

  private loadRecentFiles(): void {
    // Example:
    // this.fileService.getRecentFiles().subscribe(files => {
    //   this.recentFiles = files;
    // });
  }
}
