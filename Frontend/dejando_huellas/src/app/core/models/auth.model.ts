import { User } from './user.model';

/**
 * Authentication models
 * Matches backend auth_handler.go response structures
 */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Backend /auth/me response
 */
export interface CurrentUserResponse {
  user_id: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
