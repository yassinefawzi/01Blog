import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userData = localStorage.getItem('user');
  let token = '';

  if (userData) {
    try {
      const user = JSON.parse(userData);
      token = user.token || user.accessToken;
	  console.log("Token extracted from localStorage:", token);
    } catch (e) {
      console.error("Token parsing failed", e);
    }
  }

  const authReq = req.clone({
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true
  });

  return next(authReq);
};