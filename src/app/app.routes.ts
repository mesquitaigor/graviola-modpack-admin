import type { Routes } from '@angular/router';
import { ModpackViewComponent } from './pages/modpack-view/modpack-view';

export const routes: Routes = [
  { path: 'modpack/:id', component: ModpackViewComponent },
  {
    path: 'registry/new',
    loadComponent: () =>
      import('./pages/add-registry/add-registry').then((m) => m.AddRegistryComponent),
  },
  {
    path: 'registry/:id',
    loadComponent: () =>
      import('./pages/registry/registry').then((m) => m.Registry),
  },
  { path: '**', redirectTo: '' },
];
