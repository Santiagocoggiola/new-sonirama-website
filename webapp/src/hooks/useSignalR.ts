'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAccessToken, selectIsAuthenticated, selectIsAdmin } from '@/store/slices/authSlice';
import { addNotification, setUnreadCount } from '@/store/slices/notificationsSlice';
import { ordersApi } from '@/store/api/ordersApi';
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
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isAdmin = useAppSelector(selectIsAdmin);
  
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const connectionAttemptedRef = useRef(false);

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
    if (!accessToken || !enabled) return;

    setError(null);
    setConnectionState('connecting');

    try {
      createSignalRConnection({
        accessToken,
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
      setError(err instanceof Error ? err : new Error('Connection failed'));
      setConnectionState('disconnected');
    }
  }, [
    accessToken,
    enabled,
    isAdmin,
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
  }, []);

  // Connect when authenticated, disconnect when not
  useEffect(() => {
    if (isAuthenticated && accessToken && enabled && !connectionAttemptedRef.current) {
      connectionAttemptedRef.current = true;
      connect();
    }

    return () => {
      if (connectionAttemptedRef.current) {
        disconnect();
        connectionAttemptedRef.current = false;
      }
    };
  }, [isAuthenticated, accessToken, enabled, connect, disconnect]);

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
