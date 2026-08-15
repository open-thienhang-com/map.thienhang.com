import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { getApiBase } from '../config/api-config';

/** Attaches the bearer token to our own API calls (e.g. /retail/*) and bounces to /login on 401. Never leaks the token to third-party hosts (e.g. the Nominatim geocoder). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getToken();
  const isOwnApi = req.url.startsWith(getApiBase());
  const authedReq = token && isOwnApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((err) => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
