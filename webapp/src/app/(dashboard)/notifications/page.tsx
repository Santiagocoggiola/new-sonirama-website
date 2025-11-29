import { Metadata } from 'next';
import { NotificationsList } from '@/components/notifications/NotificationsList';

export const metadata: Metadata = {
  title: 'Notificaciones - Sonirama',
  description: 'Tus notificaciones',
};

/**
 * Notifications page
 */
export default function NotificationsPage() {
  return (
    <div id="notifications-page" data-testid="notifications-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Notificaciones
      </h1>
      
      <NotificationsList testId="notifications-list" />
    </div>
  );
}
