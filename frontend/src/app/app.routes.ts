import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'files',
    loadComponent: () => import('./files/files.component').then(m => m.FilesComponent)
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
