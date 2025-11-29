'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCredentials,
  setUser,
  logout as logoutAction,
  setLoading,
  setInitialized,
  setError,
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
  selectRefreshToken,
  selectAuthLoading,
  selectAuthError,
  selectAuthInitialized,
  selectUserRole,
  selectIsAdmin,
} from '@/store/slices/authSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { clearNotifications } from '@/store/slices/notificationsSlice';
import { useLoginMutation, useLogoutMutation, useLogoutAllMutation } from '@/store/api/authApi';
import {
  storeTokens,
  clearTokens,
  storeUser,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  isTokenExpired,
} from '@/lib/auth';
import type { UserDto, UserRole } from '@/types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Selectors
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isInitialized = useAppSelector(selectAuthInitialized);
  const role = useAppSelector(selectUserRole);
  const isAdmin = useAppSelector(selectIsAdmin);

  // Mutations
  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [logoutAllMutation] = useLogoutAllMutation();

  /**
   * Initialize auth state from localStorage (SSR-safe)
   */
  const initializeAuth = useCallback(() => {
    if (typeof window === 'undefined') return;

    dispatch(setLoading(true));

    try {
      const storedAccessToken = getStoredAccessToken();
      const storedRefreshToken = getStoredRefreshToken();
      const storedUser = getStoredUser<UserDto>();

      if (storedAccessToken && storedRefreshToken) {
        // Check if token is expired
        if (!isTokenExpired(storedAccessToken)) {
          dispatch(
            setCredentials({
              accessToken: storedAccessToken,
              refreshToken: storedRefreshToken,
              user: storedUser,
            })
          );
        } else {
          // Token expired, clear storage
          clearTokens();
        }
      }
    } catch (e) {
      console.error('Failed to initialize auth:', e);
    } finally {
      dispatch(setLoading(false));
      dispatch(setInitialized(true));
    }
  }, [dispatch]);

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      dispatch(setError(null));
      dispatch(setLoading(true));

      try {
        const response = await loginMutation({ email, password }).unwrap();
        
        // Debug: log the response to see what the backend returns
        console.log('Login response:', response);

        // Get role from response (handle both camelCase and PascalCase)
        const userRole = response.role || (response as unknown as { Role?: string }).Role || 'USER';

        // Create user object from response
        const userData: UserDto = {
          id: '',
          email: response.email || (response as unknown as { Email?: string }).Email || email,
          firstName: '',
          lastName: '',
          phoneNumber: null,
          role: userRole as UserRole,
          isActive: true,
          createdAtUtc: new Date().toISOString(),
          updatedAtUtc: null,
        };

        // Store credentials in Redux
        dispatch(
          setCredentials({
            accessToken: response.accessToken || (response as unknown as { AccessToken?: string }).AccessToken || '',
            refreshToken: response.refreshToken || (response as unknown as { RefreshToken?: string }).RefreshToken || '',
            user: userData,
          })
        );

        // Persist tokens and user to localStorage
        storeTokens(
          response.accessToken || (response as unknown as { AccessToken?: string }).AccessToken || '',
          response.refreshToken || (response as unknown as { RefreshToken?: string }).RefreshToken || ''
        );
        storeUser(userData);

        console.log('User data stored:', userData);
        console.log('Returning from login - userRole:', userRole, 'typeof:', typeof userRole);

        return { success: true, role: userRole as UserRole };
      } catch (err) {
        const errorMessage =
          (err as { data?: { error?: string } })?.data?.error ||
          'Error al iniciar sesión';
        dispatch(setError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, loginMutation]
  );

  /**
   * Logout current session
   */
  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await logoutMutation({ refreshToken }).unwrap();
      }
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      // Clear all state regardless of API result
      clearTokens();
      dispatch(logoutAction());
      dispatch(clearCart());
      dispatch(clearNotifications());
      router.push('/login');
    }
  }, [dispatch, logoutMutation, refreshToken, router]);

  /**
   * Logout all sessions
   */
  const logoutAll = useCallback(async () => {
    try {
      await logoutAllMutation().unwrap();
    } catch (e) {
      console.error('Logout all error:', e);
    } finally {
      clearTokens();
      dispatch(logoutAction());
      dispatch(clearCart());
      dispatch(clearNotifications());
      router.push('/login');
    }
  }, [dispatch, logoutAllMutation, router]);

  /**
   * Update user data in store and localStorage
   */
  const updateUser = useCallback(
    (userData: UserDto) => {
      dispatch(setUser(userData));
      storeUser(userData);
    },
    [dispatch]
  );

  /**
   * Check if user has required role
   */
  const hasRole = useCallback(
    (requiredRole: UserRole | UserRole[]): boolean => {
      if (!role) return false;
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(role);
      }
      return role === requiredRole;
    },
    [role]
  );

  // Initialize auth on mount
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized, initializeAuth]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading: isLoading || isLoginLoading,
    isInitialized,
    error,
    role,
    isAdmin,
    accessToken,
    refreshToken,
    // Actions
    login,
    logout,
    logoutAll,
    updateUser,
    hasRole,
    initializeAuth,
  };
}
