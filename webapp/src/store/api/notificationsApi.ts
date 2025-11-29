import { baseApi } from './baseApi';
import type {
  NotificationDto,
  NotificationListParams,
  PagedResult,
  CountResponse,
  MarkedAsReadResponse,
  DeletedResponse,
} from '@/types';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      PagedResult<NotificationDto>,
      NotificationListParams | void
    >({
      query: (params) => ({
        url: '/notifications',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: 'Notification' as const,
                id,
              })),
              { type: 'Notifications', id: 'LIST' },
            ]
          : [{ type: 'Notifications', id: 'LIST' }],
    }),
    getUnreadCount: builder.query<CountResponse, void>({
      query: () => '/notifications/unread-count',
      providesTags: [{ type: 'Notifications', id: 'UNREAD_COUNT' }],
    }),
    markAsRead: builder.mutation<NotificationDto, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),
    markAllAsRead: builder.mutation<MarkedAsReadResponse, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: [
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),
    deleteNotification: builder.mutation<DeletedResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notifications', id: 'LIST' },
        { type: 'Notifications', id: 'UNREAD_COUNT' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApi;
