import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, CurrentUserResponse } from '../models';
import { User, UserRole, UserStatus } from '../models';

const STORAGE_KEY = 'dh_auth_token';
const USER_KEY = 'dh_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  // Signal-based state
  private _user = signal<User | null>(this.getStoredUser());
  private _token = signal<string | null>(this.getStoredToken());
  private _isLoading = signal<boolean>(false);

  // Public computed signals
  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Login with email and password
   * Backend: POST /auth/login
   * Response: { token: string, user: User }
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this._isLoading.set(true);
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.setSession(response);
        this._isLoading.set(false);
      }),
      catchError(error => {
        this._isLoading.set(false);
        throw error;
      })
    );
  }

  /**
   * Get current user profile
   * Backend: GET /auth/me
   * Response: { user_id: string, email: string, role: string }
   */
  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.apiUrl}/auth/me`);
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /**
   * Check if token exists and is valid
   */
  hasValidToken(): boolean {
    const token = this._token();
    if (!token) return false;
    
    // Check if token appears to be a valid JWT format (has two dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Invalid JWT format - clear the invalid token
      this.clearSession();
      return false;
    }
    
    try {
      // Decode the payload to check expiration
      const payload = JSON.parse(atob(parts[1]));
      const isExpired = payload.exp ? (Date.now() / 1000) >= payload.exp : false;
      
      if (isExpired) {
        // Token is expired - clear the session
        this.clearSession();
        return false;
      }
      
      return true;
    } catch {
      // Failed to parse token - clear invalid session
      this.clearSession();
      return false;
    }
  }

  /**
   * Check if token is valid (legacy method for compatibility)
   */
  isTokenValid(): boolean {
    return this.hasValidToken();
  }

  /**
   * Set authentication session
   */
  private setSession(response: LoginResponse): void {
    this._token.set(response.token);
    this._user.set(response.user);
    
    localStorage.setItem(STORAGE_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  /**
   * Clear authentication session
   */
  private clearSession(): void {
    this._token.set(null);
    this._user.set(null);
    
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Get stored token
   */
  private getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEY);
  }

  /**
   * Get stored user
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        // Ensure role and status are typed correctly
        return {
          ...parsed,
          role: parsed.role as UserRole,
          status: parsed.status as UserStatus
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}
