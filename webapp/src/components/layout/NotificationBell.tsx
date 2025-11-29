'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Divider } from 'primereact/divider';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils';
import {
  getNotificationIcon,
  getNotificationSeverity,
} from '@/types/notification';
import type { NotificationDto } from '@/types/notification';

interface NotificationBellProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Notification bell component with dropdown
 */
export function NotificationBell({ testId = 'notification-bell' }: NotificationBellProps) {
  const router = useRouter();
  const overlayRef = useRef<OverlayPanel>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, getLink, isLoading } =
    useNotifications({ pageSize: 5 });

  const handleNotificationClick = async (notification: NotificationDto) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    const link = getLink(notification);
    if (link) {
      overlayRef.current?.hide();
      router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleViewAll = () => {
    overlayRef.current?.hide();
    router.push('/notifications');
  };

  const getSeverityClass = (type: number) => {
    const severity = getNotificationSeverity(type);
    switch (severity) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-orange-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <>
      <Button
        id={testId}
        data-testid={testId}
        icon="pi pi-bell"
        text
        rounded
        severity="secondary"
        onClick={(e) => overlayRef.current?.toggle(e)}
        aria-label="Notificaciones"
        className="p-overlay-badge"
      >
        {unreadCount > 0 && (
          <Badge
            value={unreadCount > 99 ? '99+' : unreadCount}
            severity="danger"
            data-testid={`${testId}-badge`}
          />
        )}
      </Button>

      <OverlayPanel
        ref={overlayRef}
        id={`${testId}-panel`}
        data-testid={`${testId}-panel`}
        className="w-full md:w-25rem"
        dismissable
      >
        {/* Header */}
        <div className="flex align-items-center justify-content-between mb-3">
          <h4 className="m-0 font-semibold">Notificaciones</h4>
          {unreadCount > 0 && (
            <Button
              id={`${testId}-mark-all-read`}
              data-testid={`${testId}-mark-all-read`}
              label="Marcar todas como leídas"
              link
              size="small"
              onClick={handleMarkAllAsRead}
            />
          )}
        </div>

        <Divider className="my-2" />

        {/* Notifications list */}
        <div
          id={`${testId}-list`}
          data-testid={`${testId}-list`}
          className="flex flex-column gap-2"
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        >
          {isLoading ? (
            <div className="flex align-items-center justify-content-center p-4">
              <i className="pi pi-spin pi-spinner text-xl" />
            </div>
          ) : notifications.length === 0 ? (
            <div
              id={`${testId}-empty`}
              data-testid={`${testId}-empty`}
              className="text-center p-4 text-color-secondary"
            >
              <i className="pi pi-inbox text-4xl mb-2 block" style={{ opacity: 0.5 }} />
              <p className="m-0">No tenés notificaciones</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                id={`${testId}-item-${notification.id}`}
                data-testid={`${testId}-item-${notification.id}`}
                className={`flex gap-3 p-2 border-round cursor-pointer hover:surface-hover ${
                  !notification.isRead ? 'surface-50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleNotificationClick(notification);
                  }
                }}
              >
                <i
                  className={`${getNotificationIcon(notification.type)} ${getSeverityClass(
                    notification.type
                  )} text-xl`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex align-items-center gap-2">
                    <span className="font-medium text-color text-sm line-clamp-1">
                      {notification.title}
                    </span>
                    {!notification.isRead && (
                      <span
                        className="border-circle bg-primary"
                        style={{ width: '8px', height: '8px' }}
                        data-testid={`${testId}-item-${notification.id}-unread`}
                      />
                    )}
                  </div>
                  <p className="m-0 text-color-secondary text-xs line-clamp-2">
                    {notification.body}
                  </p>
                  <span className="text-color-secondary text-xs">
                    {formatRelativeTime(notification.createdAtUtc)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <Divider className="my-2" />
            <Button
              id={`${testId}-view-all`}
              data-testid={`${testId}-view-all`}
              label="Ver todas las notificaciones"
              link
              className="w-full"
              onClick={handleViewAll}
            />
          </>
        )}
      </OverlayPanel>
    </>
  );
}
