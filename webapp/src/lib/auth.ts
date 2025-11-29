/**
 * Auth utilities for token storage and management
 * SSR-safe implementation
 */

const ACCESS_TOKEN_KEY = 'sonirama_access_token';
const REFRESH_TOKEN_KEY = 'sonirama_refresh_token';
const USER_KEY = 'sonirama_user';

// Check if we're running on the client
const isClient = typeof window !== 'undefined';

/**
 * Get stored access token
 */
export function getStoredAccessToken(): string | null {
  if (!isClient) return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Get stored refresh token
 */
export function getStoredRefreshToken(): string | null {
  if (!isClient) return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Store tokens in localStorage
 */
export function storeTokens(accessToken: string, refreshToken: string): void {
  if (!isClient) return;
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (e) {
    console.error('Failed to store tokens:', e);
  }
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  if (!isClient) return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.error('Failed to clear tokens:', e);
  }
}

/**
 * Store user data
 */
export function storeUser<T>(user: T): void {
  if (!isClient) return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to store user:', e);
  }
}

/**
 * Get stored user data
 */
export function getStoredUser<T>(): T | null {
  if (!isClient) return null;
  try {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Parse JWT token to get payload
 */
export function parseJwt<T = Record<string, unknown>>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwt<{ exp?: number }>(token);
  if (!payload?.exp) return true;
  // Add 30 seconds buffer
  return Date.now() >= (payload.exp - 30) * 1000;
}

/**
 * Get token expiration time in milliseconds
 */
export function getTokenExpirationTime(token: string): number | null {
  const payload = parseJwt<{ exp?: number }>(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}
