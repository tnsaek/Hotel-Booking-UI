import { HttpInterceptorFn } from '@angular/common/http';

const tokenKey = 'auth_token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');
  const isPublicHotelGet = req.method === 'GET' && req.url.includes('/hotels');

  if (isAuthRequest || isPublicHotelGet) {
    return next(req);
  }

  const token = localStorage.getItem(tokenKey);

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    })
  );
};
