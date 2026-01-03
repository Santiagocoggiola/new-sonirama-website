"use client";

import { useSignalR } from "@/hooks/useSignalR";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Boots SignalR + notifications side-effects globally.
 * Renders nothing.
 */
export function RealtimeProvider() {
  // Mounting the hook is enough; it auto-conecta/desconecta según auth
  useSignalR({ enabled: true });

  // Prime the notifications store/unread count on app load for the current user
  useNotifications({ pageSize: 10 });

  return null;
}

export default RealtimeProvider;
