/**
 * SignalR client configuration for real-time notifications
 */

import * as signalR from '@microsoft/signalr';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'https://localhost:5001';
const HUB_URL = `${WS_BASE_URL}/hubs/orders`;

let connection: signalR.HubConnection | null = null;

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface SignalROptions {
  accessToken: string;
  onConnectionStateChange?: (state: ConnectionState) => void;
  onReconnecting?: (error?: Error) => void;
  onReconnected?: (connectionId?: string) => void;
  onClose?: (error?: Error) => void;
}

/**
 * Create and configure a SignalR connection
 */
export function createSignalRConnection(options: SignalROptions): signalR.HubConnection {
  const { accessToken, onConnectionStateChange, onReconnecting, onReconnected, onClose } = options;

  // Stop existing connection if any
  if (connection) {
    connection.stop();
    connection = null;
  }

  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => accessToken,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: (retryContext) => {
        // Exponential backoff: 0, 2s, 5s, 10s, 30s
        const delays = [0, 2000, 5000, 10000, 30000];
        return delays[Math.min(retryContext.previousRetryCount, delays.length - 1)];
      },
    })
    .configureLogging(
      process.env.NODE_ENV === 'production'
        ? signalR.LogLevel.Warning
        : signalR.LogLevel.Information
    )
    .build();

  // Connection lifecycle events
  connection.onreconnecting((error) => {
    onConnectionStateChange?.('reconnecting');
    onReconnecting?.(error);
  });

  connection.onreconnected((connectionId) => {
    onConnectionStateChange?.('connected');
    onReconnected?.(connectionId);
  });

  connection.onclose((error) => {
    onConnectionStateChange?.('disconnected');
    onClose?.(error);
  });

  return connection;
}

/**
 * Get the current SignalR connection
 */
export function getConnection(): signalR.HubConnection | null {
  return connection;
}

/**
 * Start the SignalR connection
 */
export async function startConnection(): Promise<void> {
  if (!connection) {
    throw new Error('SignalR connection not initialized. Call createSignalRConnection first.');
  }

  if (connection.state === signalR.HubConnectionState.Connected) {
    return;
  }

  try {
    await connection.start();
  } catch (error) {
    console.error('SignalR connection error:', error);
    throw error;
  }
}

/**
 * Stop the SignalR connection
 */
export async function stopConnection(): Promise<void> {
  if (connection) {
    try {
      await connection.stop();
    } catch (error) {
      console.error('Error stopping SignalR connection:', error);
    }
    connection = null;
  }
}

/**
 * Subscribe to a specific user's events (for admin panels)
 */
export async function subscribeToUser(userId: string): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error('SignalR not connected');
  }
  await connection.invoke('SubscribeToUser', userId);
}

/**
 * Subscribe to admin group (only for admin users)
 */
export async function subscribeToAdmins(): Promise<void> {
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
    throw new Error('SignalR not connected');
  }
  await connection.invoke('SubscribeToAdmins');
}

/**
 * Type-safe event handler registration
 */
export type SignalREventHandlers = {
  OrderCreated: (order: unknown) => void;
  OrderUpdated: (order: unknown) => void;
  NewNotification: (notification: unknown) => void;
  UnreadCountChanged: (data: { count: number }) => void;
};

export function registerEventHandler<K extends keyof SignalREventHandlers>(
  eventName: K,
  handler: SignalREventHandlers[K]
): void {
  if (!connection) {
    console.warn('SignalR connection not initialized');
    return;
  }
  connection.on(eventName, handler);
}

export function unregisterEventHandler<K extends keyof SignalREventHandlers>(
  eventName: K,
  handler: SignalREventHandlers[K]
): void {
  if (!connection) return;
  connection.off(eventName, handler);
}

export function unregisterAllHandlers(eventName: keyof SignalREventHandlers): void {
  if (!connection) return;
  connection.off(eventName);
}
