/**
 * Authentication types
 */

export type UserRole = 'ADMIN' | 'USER';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  role: UserRole;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  mensaje: string;
}

export interface LogoutAllResponse {
  mensaje: string;
  cantidad: number;
}

export interface PasswordResetStartRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  code: string;
}
