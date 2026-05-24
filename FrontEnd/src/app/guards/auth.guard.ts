import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const loginGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return true;
  }

  return authService.isLoading$.pipe(
    filter((loading) => loading === false),
    take(1),
    map(() => {
      if (authService.isLoggedIn()) {
		console.log('User already logged in, redirecting to home');
        router.navigate(['/home']);
        return false;
      }
      return true;
    }),
  );
};

export const authGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  if (isPlatformServer(platformId)) {
    return true;
  }

  return authService.isLoading$.pipe(
    filter((loading) => loading === false),
    take(1),
    map(() => {
      if (authService.isLoggedIn()) {
        return true;
      } else {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    }),
  );
};