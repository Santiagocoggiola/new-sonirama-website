import { baseApi } from './baseApi';
import type {
  UserDto,
  UserCreateRequest,
  UserUpdateRequest,
  UserListParams,
  PagedResult,
} from '@/types';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PagedResult<UserDto>, UserListParams | void>({
      query: (params) => ({
        url: '/users',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'Users', id: 'LIST' },
            ]
          : [{ type: 'Users', id: 'LIST' }],
    }),
    getUserById: builder.query<UserDto, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<UserDto, UserCreateRequest>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: builder.mutation<UserDto, { id: string; body: UserUpdateRequest }>({
      query: ({ id, body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'User', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
    passwordResetStart: builder.mutation<void, string>({
      query: (email) => ({
        url: '/users/password-reset/start',
        method: 'POST',
        params: { email },
      }),
    }),
    passwordResetConfirm: builder.mutation<void, { email: string; code: string }>({
      query: ({ email, code }) => ({
        url: '/users/password-reset/confirm',
        method: 'POST',
        params: { email, code },
      }),
    }),
    forcePasswordReset: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/users/${userId}/password-reset/force`,
        method: 'POST',
      }),
    }),
    // Profile endpoints (self-service)
    getMyProfile: builder.query<UserDto, void>({
      query: () => '/users/me',
      providesTags: ['Profile'],
    }),
    updateProfile: builder.mutation<UserDto, { firstName: string; lastName: string; phone?: string | null }>({
      query: (body) => ({
        url: '/users/me',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Profile'],
    }),
    changePassword: builder.mutation<void, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: '/users/me/password',
        method: 'PUT',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  usePasswordResetStartMutation,
  usePasswordResetConfirmMutation,
  useForcePasswordResetMutation,
  useGetMyProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = usersApi;
