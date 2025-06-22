import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'explorer',
    loadComponent: () => import('./pages/file-explorer/file-explorer.component').then(m => m.FileExplorerComponent)
  },
  {
    path: 'explorer/:id',
    loadComponent: () => import('./pages/file-explorer/file-explorer.component').then(m => m.FileExplorerComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./pages/upload/upload.component').then(m => m.UploadComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
