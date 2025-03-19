import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
}

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class FilesComponent implements OnInit {
  // View mode (grid or list)
  viewMode: 'grid' | 'list' = 'grid';

  // Search
  searchQuery: string = '';

  // Files arrays
  allFiles: FileItem[] = [];
  filteredFiles: FileItem[] = [];

  // Delete modal
  showDeleteModal: boolean = false;
  fileToDelete: FileItem | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // In a real application, you would fetch this data from a service
    this.loadFiles();
  }

  loadFiles(): void {
    // Mock data - replace with actual API call in production
    this.allFiles = [
      {
        id: '1',
        name: 'sample-document.pdf',
        size: '2.5 MB',
        uploadDate: 'Mar 17, 2025'
      },
      {
        id: '2',
        name: 'project-proposal.pdf',
        size: '1.2 MB',
        uploadDate: 'Mar 14, 2025'
      },
      {
        id: '3',
        name: 'user-manual.pdf',
        size: '4.7 MB',
        uploadDate: 'Mar 9, 2025'
      },
      {
        id: '4',
        name: 'financial-report-2023.pdf',
        size: '3.1 MB',
        uploadDate: 'Mar 4, 2025'
      }
    ];

    this.filteredFiles = [...this.allFiles];
  }

  // Set view mode (grid or list)
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    // You could save this preference to localStorage
    localStorage.setItem('filesViewMode', mode);
  }

  // Filter files based on search query
  filterFiles(): void {
    if (!this.searchQuery) {
      this.filteredFiles = [...this.allFiles];
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredFiles = this.allFiles.filter(file =>
      file.name.toLowerCase().includes(query)
    );
  }

  // Navigate to upload page
  navigateToUpload(): void {
    this.router.navigate(['/upload']);
  }

  // Delete file confirmation
  confirmDelete(file: FileItem): void {
    this.fileToDelete = file;
    this.showDeleteModal = true;
  }

  // Cancel delete
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.fileToDelete = null;
  }

  // Delete file
  deleteFile(): void {
    if (!this.fileToDelete) return;

    // In a real application, you would call a service to delete the file
    // this.fileService.deleteFile(this.fileToDelete.id).subscribe(() => {
    //   // After successful deletion
    //   this.allFiles = this.allFiles.filter(file => file.id !== this.fileToDelete.id);
    //   this.filterFiles(); // Re-apply search filter
    //   this.showDeleteModal = false;
    //   this.fileToDelete = null;
    // });

    // For demo, just filter the file out of the array
    this.allFiles = this.allFiles.filter(file => file.id !== this.fileToDelete!.id);
    this.filterFiles(); // Re-apply search filter
    this.showDeleteModal = false;
    this.fileToDelete = null;
  }

  // Handle view file action
  viewFile(file: FileItem): void {
    // In a real application, you would navigate to a viewer or open the file
    console.log('Viewing file:', file.name);
  }

  // Handle download file action
  downloadFile(file: FileItem): void {
    // In a real application, you would call a service to download the file
    console.log('Downloading file:', file.name);
  }
}
