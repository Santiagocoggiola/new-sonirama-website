'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils';
import { getNotificationIcon, getNotificationSeverity } from '@/types/notification';
import { EmptyState } from '@/components/ui/EmptyState';
import type { NotificationDto } from '@/types/notification';

interface NotificationsListProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Full notifications list component
 */
export function NotificationsList({ testId = 'notifications-list' }: NotificationsListProps) {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    getLink,
    unreadCount,
  } = useNotifications({ pageSize: 50 });

  const handleNotificationClick = async (notification: NotificationDto) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    const link = getLink(notification);
    if (link) {
      router.push(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
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

  // Column templates
  const iconTemplate = (notification: NotificationDto) => (
    <i
      className={`${getNotificationIcon(notification.type)} ${getSeverityClass(
        notification.type
      )} text-xl`}
    />
  );

  const contentTemplate = (notification: NotificationDto) => (
    <div
      className="cursor-pointer"
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex align-items-center gap-2">
        <span
          className={`font-medium ${
            !notification.isRead ? 'text-color' : 'text-color-secondary'
          }`}
        >
          {notification.title}
        </span>
        {!notification.isRead && (
          <span
            className="border-circle bg-primary"
            style={{ width: '8px', height: '8px' }}
          />
        )}
      </div>
      <p className="m-0 mt-1 text-color-secondary text-sm">
        {notification.body}
      </p>
    </div>
  );

  const dateTemplate = (notification: NotificationDto) => (
    <span className="text-color-secondary text-sm">
      {formatRelativeTime(notification.createdAtUtc)}
    </span>
  );

  const actionsTemplate = (notification: NotificationDto) => {
    const link = getLink(notification);
    return link ? (
      <Button
        icon="pi pi-arrow-right"
        rounded
        text
        severity="secondary"
        onClick={() => handleNotificationClick(notification)}
        aria-label="Ver más"
        tooltip="Ver más"
        tooltipOptions={{ position: 'top' }}
      />
    ) : null;
  };

  const rowClassName = (notification: NotificationDto) => ({
    'surface-50': !notification.isRead,
  });

  if (isLoading) {
    return (
      <div
        id={`${testId}-loading`}
        data-testid={`${testId}-loading`}
        className="flex align-items-center justify-content-center py-8"
      >
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          strokeWidth="4"
        />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        testId={`${testId}-empty`}
        icon="pi pi-inbox"
        title="No tenés notificaciones"
        message="Las notificaciones de tus pedidos aparecerán acá."
      />
    );
  }

  return (
    <div id={testId} data-testid={testId}>
      {/* Header actions */}
      {unreadCount > 0 && (
        <div className="flex justify-content-end mb-3">
          <Button
            id={`${testId}-mark-all-read`}
            data-testid={`${testId}-mark-all-read`}
            label="Marcar todas como leídas"
            icon="pi pi-check-circle"
            text
            onClick={handleMarkAllAsRead}
          />
        </div>
      )}

      <DataTable
        value={notifications}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        className="surface-card border-round"
        rowClassName={rowClassName}
        responsiveLayout="scroll"
      >
        <Column
          body={iconTemplate}
          style={{ width: '60px' }}
        />
        <Column
          header="Notificación"
          body={contentTemplate}
        />
        <Column
          header="Fecha"
          body={dateTemplate}
          style={{ width: '150px' }}
        />
        <Column
          body={actionsTemplate}
          style={{ width: '80px' }}
        />
      </DataTable>
    </div>
  );
}
