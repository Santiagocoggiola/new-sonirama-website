import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import { setTokens, logout } from '../slices/authSlice';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:5001/api';

// Create a custom baseQuery with auth token injection and refresh logic
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
  credentials: 'include',
});

// Wrapper with automatic token refresh on 401
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Try to refresh the token
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as {
          accessToken: string;
          refreshToken: string;
        };
        // Store the new tokens
        api.dispatch(
          setTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );
        // Retry the original request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, logout
        api.dispatch(logout());
      }
    } else {
      // No refresh token, logout
      api.dispatch(logout());
    }
  }

  return result;
};

// Define tag types for cache invalidation
export const tagTypes = [
  'Auth',
  'User',
  'Users',
  'Profile',
  'Product',
  'Products',
  'Category',
  'Categories',
  'Cart',
  'Order',
  'Orders',
  'Notification',
  'Notifications',
  'BulkDiscount',
] as const;

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes,
  endpoints: () => ({}),
  // Enable keepUnusedDataFor: 60 (default) - 60 seconds
  // refetchOnMountOrArgChange: false (default)
  // refetchOnFocus: false (default), can enable via setupListeners
  // refetchOnReconnect: false (default), can enable via setupListeners
});

export type TagTypes = (typeof tagTypes)[number];
