import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const tokenExpired = error.headers.get('X-Token-Expired') === 'true';
      const accountBanned = error.headers.get('X-Account-Banned') === 'true';
      const isAuthEndpoint = req.url.includes('/auth/');
      const alreadyOnError = router.url.startsWith('/error');

      if (!isAuthEndpoint && !alreadyOnError && (error.status === 401 || error.status === 403 || error.status === 404 || error.status >= 500)) {
        let code = String(error.status);
        if (accountBanned) code = 'banned';
        else if (tokenExpired) code = 'expired';

        if (error.status === 401 || accountBanned) {
          auth.clearSession();
        }
        router.navigate(['/error'], { queryParams: { code } });
      }

      return throwError(() => error);
    })
  );
};
