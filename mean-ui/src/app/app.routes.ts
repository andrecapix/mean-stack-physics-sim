import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  // Auth routes (accessible only when not authenticated)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  // Protected routes (accessible only when authenticated)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'simulation',
    canActivate: [authGuard],
    loadComponent: () => import('./features/simulation/simulation.component').then(m => m.SimulationComponent)
  },
  // Admin routes (accessible only for admin users)
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'analytics',
        loadComponent: () => import('./features/admin/analytics/analytics.component').then(m => m.AnalyticsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: '',
        redirectTo: 'analytics',
        pathMatch: 'full'
      }
    ]
  },
  // Catch all route
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];