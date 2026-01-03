'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectAccessToken,
  selectIsAuthenticated,
  selectIsAdmin,
  selectRefreshToken,
  setTokens,
  logout,
} from '@/store/slices/authSlice';
import { useRefreshMutation } from '@/store/api/authApi';
import { addNotification, setUnreadCount } from '@/store/slices/notificationsSlice';
import { ordersApi } from '@/store/api/ordersApi';
import { notificationsApi } from '@/store/api/notificationsApi';
import {
  createSignalRConnection,
  startConnection,
  stopConnection,
  getConnection,
  registerEventHandler,
  unregisterAllHandlers,
  subscribeToAdmins,
  type ConnectionState,
} from '@/lib/signalr';
import { showToast } from '@/components/ui/toast-service';
import type { OrderDto, NotificationDto } from '@/types';
import { getNotificationSeverity } from '@/types/notification';

interface UseSignalROptions {
  enabled?: boolean;
}

export function useSignalR(options: UseSignalROptions = {}) {
  const { enabled = true } = options;
  const dispatch = useAppDispatch();
  
  const accessToken = useAppSelector(selectAccessToken);
  const refreshToken = useAppSelector(selectRefreshToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  const [refresh] = useRefreshMutation();
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const connectingRef = useRef(false);
  const tokenUsedRef = useRef<string | null>(null);

  /**
   * Handle OrderCreated event
   */
  const handleOrderCreated = useCallback(
    (order: OrderDto) => {
      // Invalidate orders cache
      dispatch(ordersApi.util.invalidateTags(['Orders']));
      
      // Show toast
      if (isAdmin) {
        showToast({
          severity: 'info',
          summary: 'Nueva orden recibida',
          detail: `Orden ${order.number} - Total: $${order.total.toFixed(2)}`,
          life: 5000,
        });
      } else {
        showToast({
          severity: 'success',
          summary: 'Orden creada',
          detail: `Tu orden ${order.number} fue creada exitosamente`,
          life: 5000,
        });
      }
    },
    [dispatch, isAdmin]
  );

  /**
   * Handle OrderUpdated event
   */
  const handleOrderUpdated = useCallback(
    (order: OrderDto) => {
      // Invalidate specific order and list
      dispatch(
        ordersApi.util.invalidateTags([
          { type: 'Order', id: order.id },
          'Orders',
        ])
      );

      // Show toast
      showToast({
        severity: 'info',
        summary: 'Orden actualizada',
        detail: `Orden ${order.number}: ${getStatusLabel(order.status)}`,
        life: 4000,
      });
    },
    [dispatch]
  );

  /**
   * Handle NewNotification event
   */
  const handleNewNotification = useCallback(
    (notification: NotificationDto) => {
      // Add to notifications state
      dispatch(addNotification(notification));

       // Force-fetch server state to keep list + counts in sync
      dispatch(
        notificationsApi.util.invalidateTags([
          { type: 'Notifications', id: 'LIST' },
          { type: 'Notifications', id: 'UNREAD_COUNT' },
        ])
      );

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
   * Handle UnreadCountChanged event
   */
  const handleUnreadCountChanged = useCallback(
    (data: { count: number }) => {
      dispatch(setUnreadCount(data.count));
    },
    [dispatch]
  );

  /**
   * Connect to SignalR hub
   */
  const connect = useCallback(async () => {
    if (!enabled || !isAuthenticated) return;
    if (connectingRef.current) return;
    connectingRef.current = true;

    setError(null);
    setConnectionState('connecting');

    try {
      // Ensure we have a valid access token; refresh if missing/expired
      let tokenToUse = accessToken;
      if (!tokenToUse && refreshToken) {
        try {
          const refreshed = await refresh({ refreshToken }).unwrap();
          tokenToUse = refreshed.accessToken;
          dispatch(
            setTokens({
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
            })
          );
        } catch (refreshError) {
          console.error('SignalR token refresh failed:', refreshError);
          dispatch(logout());
          throw refreshError;
        }
      }

      if (!tokenToUse) {
        throw new Error('No access token available for SignalR connection');
      }

      // Avoid rebuilding the connection if already connected with the same token
      const existing = getConnection();
      if (
        existing &&
        existing.state === 'Connected' &&
        tokenUsedRef.current === tokenToUse
      ) {
        setConnectionState('connected');
        connectingRef.current = false;
        return;
      }

      tokenUsedRef.current = tokenToUse;

      createSignalRConnection({
        accessToken: tokenToUse,
        onConnectionStateChange: setConnectionState,
        onReconnecting: (err) => {
          console.warn('SignalR reconnecting:', err);
        },
        onReconnected: (connectionId) => {
          console.info('SignalR reconnected:', connectionId);
          // Re-subscribe to admin group if needed
          if (isAdmin) {
            subscribeToAdmins().catch(console.error);
          }
        },
        onClose: (err) => {
          if (err) {
            console.error('SignalR connection closed with error:', err);
            setError(err);
          }
        },
      });

      // Register event handlers
      registerEventHandler('OrderCreated', handleOrderCreated as (order: unknown) => void);
      registerEventHandler('OrderUpdated', handleOrderUpdated as (order: unknown) => void);
      registerEventHandler('NewNotification', handleNewNotification as (notification: unknown) => void);
      registerEventHandler('UnreadCountChanged', handleUnreadCountChanged);

      // Start connection
      await startConnection();
      setConnectionState('connected');

      // Subscribe to admin group if user is admin
      if (isAdmin) {
        await subscribeToAdmins();
      }
    } catch (err) {
      console.error('Failed to connect to SignalR:', err);
      // If unauthorized, try a single refresh + retry
      const shouldRetry =
        refreshToken &&
        err instanceof Error &&
        /401|Unauthorized/i.test(err.message);

      if (shouldRetry) {
        try {
          const refreshed = await refresh({ refreshToken }).unwrap();
          dispatch(
            setTokens({
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
            })
          );
          tokenUsedRef.current = null;
          connectingRef.current = false;
          await connect();
          return;
        } catch (refreshError) {
          console.error('SignalR retry after refresh failed:', refreshError);
          dispatch(logout());
        }
      }

      setError(err instanceof Error ? err : new Error('Connection failed'));
      setConnectionState('disconnected');
    } finally {
      connectingRef.current = false;
    }
  }, [
    accessToken,
    refreshToken,
    refresh,
    dispatch,
    enabled,
    isAdmin,
    isAuthenticated,
    handleOrderCreated,
    handleOrderUpdated,
    handleNewNotification,
    handleUnreadCountChanged,
  ]);

  /**
   * Disconnect from SignalR hub
   */
  const disconnect = useCallback(async () => {
    // Unregister all handlers
    unregisterAllHandlers('OrderCreated');
    unregisterAllHandlers('OrderUpdated');
    unregisterAllHandlers('NewNotification');
    unregisterAllHandlers('UnreadCountChanged');

    await stopConnection();
    setConnectionState('disconnected');
    tokenUsedRef.current = null;
  }, []);

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, enabled, accessToken, refreshToken, connect, disconnect]);

  // Reconnect when access token changes (after refresh)
  useEffect(() => {
    const connection = getConnection();
    if (connection && accessToken && connectionState === 'connected') {
      // Token changed, might need to reconnect
      // The connection will use the new token on next reconnect
    }
  }, [accessToken, connectionState]);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    isReconnecting: connectionState === 'reconnecting',
    error,
    connect,
    disconnect,
  };
}

// Helper function to get status label in Spanish
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PendingApproval: 'Pendiente de aprobación',
    Approved: 'Aprobada',
    Rejected: 'Rechazada',
    ModificationPending: 'Modificación pendiente',
    Confirmed: 'Confirmada',
    ReadyForPickup: 'Lista para retiro',
    Completed: 'Completada',
    Cancelled: 'Cancelada',
  };
  return labels[status] || status;
}
