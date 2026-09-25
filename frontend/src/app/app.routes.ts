import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'feed',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feed/feed.component').then(m => m.FeedComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feed/create-post/create-post.component').then(m => m.CreatePostComponent)
  },
  {
    path: 'search',
    canActivate: [authGuard],
    loadComponent: () => import('./features/search/user-search-page.component').then(m => m.UserSearchPageComponent)
  },
  {
    path: 'posts/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/feed/post-detail/post-detail.component').then(m => m.PostDetailComponent)
  },
  {
    path: 'profile/:username',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  {
    path: 'error',
    loadComponent: () => import('./features/error/error-page.component').then(m => m.ErrorPageComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./features/error/error-page.component').then(m => m.ErrorPageComponent),
    data: { code: '404' }
  }
];
