import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { NotificationDto } from '@/types';

interface NotificationsState {
  items: NotificationDto[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<NotificationDto[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    addNotification: (state, action: PayloadAction<NotificationDto>) => {
      // Add to the beginning of the list
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        notification.readAtUtc = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      const now = new Date().toISOString();
      state.items.forEach((notification) => {
        if (!notification.isRead) {
          notification.isRead = true;
          notification.readAtUtc = now;
        }
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
    setNotificationsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setNotificationsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.error = null;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  setUnreadCount,
  markAsRead,
  markAllAsRead,
  removeNotification,
  setNotificationsLoading,
  setNotificationsError,
  clearNotifications,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state: { notifications: NotificationsState }) =>
  state.notifications.items;
export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.unreadCount;
export const selectNotificationsLoading = (state: {
  notifications: NotificationsState;
}) => state.notifications.isLoading;
export const selectNotificationsError = (state: {
  notifications: NotificationsState;
}) => state.notifications.error;
export const selectUnreadNotifications = (state: {
  notifications: NotificationsState;
}) => state.notifications.items.filter((n) => !n.isRead);

export default notificationsSlice.reducer;
