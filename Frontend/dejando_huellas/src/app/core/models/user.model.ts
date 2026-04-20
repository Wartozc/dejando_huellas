/**
 * User model representing a member of the organization
 * Matches backend domain/user.go
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  community?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'ADMIN' | 'MEMBER';
export type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Request DTOs
 */
export interface UserCreateDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
  community?: string;
}

export interface UserUpdateDto {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  community?: string;
}

/**
 * Backend response wrapper for user list
 */
export interface UsersResponse {
  users: User[];
}

/**
 * Backend response wrapper for single user
 */
export interface UserResponse {
  user: User;
  message?: string;
}
