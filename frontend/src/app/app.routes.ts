import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'explorer',
    loadComponent: () => import('./file-explorer/file-explorer.component').then(m => m.FileExplorerComponent)
  },
  {
    path: 'explorer/:id',
    loadComponent: () => import('./file-explorer/file-explorer.component').then(m => m.FileExplorerComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./upload/upload.component').then(m => m.UploadComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
