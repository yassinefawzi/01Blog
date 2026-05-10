import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs';

export const loginGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoading$.pipe(
    filter(loading => loading === false),
    take(1),
    map(() => {
      if (authService.isLoggedIn()) {
        router.navigate(['/home']);
        return false;
      }
      return true;
    })
  );
};

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoading$.pipe(
    filter(loading => loading === false),
    take(1),
    map(() => {
      if (authService.isLoggedIn()) {
        return true;
      } else {
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        return false;
      }
    })
  );
};