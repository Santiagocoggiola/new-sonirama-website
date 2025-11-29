'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addNotification,
  setUnreadCount,
  setNotifications,
  markAsRead as markAsReadAction,
  markAllAsRead as markAllAsReadAction,
  removeNotification,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadNotifications,
} from '@/store/slices/notificationsSlice';
import {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} from '@/store/api/notificationsApi';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { showToast } from '@/components/ui/toast-service';
import {
  NotificationDto,
  NotificationListParams,
  getNotificationSeverity,
  getNotificationLink,
} from '@/types/notification';

export function useNotifications(params?: NotificationListParams) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Selectors
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const isLoading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);

  // RTK Query hooks
  const {
    data: notificationsData,
    isLoading: isNotificationsLoading,
    isFetching: isNotificationsFetching,
    refetch: refetchNotifications,
  } = useGetNotificationsQuery(params || {}, {
    skip: !isAuthenticated,
  });

  const {
    data: unreadCountData,
    refetch: refetchUnreadCount,
  } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: 60000, // Poll every minute
  });

  const [markAsReadMutation] = useMarkAsReadMutation();
  const [markAllAsReadMutation] = useMarkAllAsReadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();

  // Sync unread count from API
  useEffect(() => {
    if (unreadCountData) {
      dispatch(setUnreadCount(unreadCountData.count));
    }
  }, [unreadCountData, dispatch]);

  // Sync notifications from API
  useEffect(() => {
    if (notificationsData?.items) {
      dispatch(setNotifications(notificationsData.items));
    }
  }, [notificationsData, dispatch]);

  /**
   * Add a new notification (for real-time updates)
   */
  const addNewNotification = useCallback(
    (notification: NotificationDto) => {
      dispatch(addNotification(notification));

      // Show toast
      showToast({
        severity: getNotificationSeverity(notification.type),
        summary: notification.title,
        detail: notification.body,
        life: 5000,
      });
    },
    [dispatch]
  );

  /**
   * Update unread count (for real-time updates)
   */
  const updateUnreadCount = useCallback(
    (count: number) => {
      dispatch(setUnreadCount(count));
    },
    [dispatch]
  );

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsReadMutation(id).unwrap();
        dispatch(markAsReadAction(id));
        return { success: true };
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        return { success: false };
      }
    },
    [markAsReadMutation, dispatch]
  );

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation().unwrap();
      dispatch(markAllAsReadAction());
      return { success: true };
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return { success: false };
    }
  }, [markAllAsReadMutation, dispatch]);

  /**
   * Delete a notification
   */
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await deleteNotificationMutation(id).unwrap();
        dispatch(removeNotification(id));
        return { success: true };
      } catch (err) {
        console.error('Failed to delete notification:', err);
        return { success: false };
      }
    },
    [deleteNotificationMutation, dispatch]
  );

  /**
   * Get link for notification navigation
   */
  const getLink = useCallback((notification: NotificationDto) => {
    return getNotificationLink(notification);
  }, []);

  return {
    // State
    notifications,
    unreadCount,
    unreadNotifications,
    isLoading: isLoading || isNotificationsLoading || isNotificationsFetching,
    error,
    totalCount: notificationsData?.totalCount ?? 0,
    // Actions
    addNewNotification,
    updateUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetchNotifications,
    refetchUnreadCount,
    // Utilities
    getLink,
  };
}
