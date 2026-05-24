import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  let userToken = '';
  if (isPlatformBrowser(platformId)) {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        userToken = parsedUser?.token || ''; 
      } catch (e) {
        console.error('Error parsing user from localStorage in interceptor', e);
      }
    }
  }
  if (userToken) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    return next(clonedRequest);
  }
  return next(req);
};