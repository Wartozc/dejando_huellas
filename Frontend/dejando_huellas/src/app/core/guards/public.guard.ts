import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has a valid token stored
  const hasValidToken = authService.hasValidToken();

  // Only redirect if user has a valid authenticated session
  if (hasValidToken) {
    if (authService.isAdmin()) {
      router.navigate(['/admin/dashboard']);
    } else {
      router.navigate(['/']);
    }
    return false;
  }

  // No valid token - allow access to public route (register, login, etc.)
  return true;
};
