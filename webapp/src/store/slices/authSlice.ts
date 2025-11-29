import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserDto, UserRole } from '@/types';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

interface SetCredentialsPayload {
  user?: UserDto | null;
  accessToken: string;
  refreshToken: string;
  role?: UserRole;
  email?: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
      const { accessToken, refreshToken, user, role, email } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.error = null;
      
      // If user is provided, use it; otherwise create a partial user from role/email
      if (user) {
        state.user = user;
      } else if (role && email) {
        state.user = {
          id: '',
          email,
          firstName: '',
          lastName: '',
          phoneNumber: null,
          role,
          isActive: true,
          createdAtUtc: '',
          updatedAtUtc: null,
        };
      }
    },
    setUser: (state, action: PayloadAction<UserDto>) => {
      state.user = action.payload;
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
});

export const {
  setCredentials,
  setUser,
  setTokens,
  setLoading,
  setInitialized,
  setError,
  logout,
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectRefreshToken = (state: { auth: AuthState }) =>
  state.auth.refreshToken;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;
export const selectAuthInitialized = (state: { auth: AuthState }) =>
  state.auth.isInitialized;
export const selectUserRole = (state: { auth: AuthState }) =>
  state.auth.user?.role ?? null;
export const selectIsAdmin = (state: { auth: AuthState }) =>
  state.auth.user?.role === 'ADMIN';

export default authSlice.reducer;
