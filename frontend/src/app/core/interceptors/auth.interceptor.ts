import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthError = error.status === 401 || error.status === 403;
      const tokenExpired = error.headers.get('X-Token-Expired') === 'true';
      const accountBanned = error.headers.get('X-Account-Banned') === 'true';
      const hasToken = !!auth.token;
      const isAuthEndpoint = req.url.includes('/auth/');

      if (hasToken && isAuthError && !isAuthEndpoint) {
        auth.logout(accountBanned ? { banned: '1' } : tokenExpired ? { expired: '1' } : undefined);
      }

      return throwError(() => error);
    })
  );
};
