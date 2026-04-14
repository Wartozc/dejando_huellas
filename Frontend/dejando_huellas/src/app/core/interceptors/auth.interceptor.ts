import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const token = authService.token();

  // Clone request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - clear session and redirect to login
        authService.logout();
        toastService.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        toastService.error('No tienes permisos para realizar esta acción.');
        router.navigate(['/']);
      } else if (error.status === 0) {
        // Network error
        toastService.error('Error de conexión. Verifica tu conexión a internet.');
      }

      return throwError(() => error);
    })
  );
};
