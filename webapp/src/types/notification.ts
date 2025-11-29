/**
 * Notification types
 */

export enum NotificationType {
  OrderCreated = 0,
  OrderStatusChanged = 1,
  OrderApproved = 2,
  OrderRejected = 3,
  OrderReady = 4,
  OrderCompleted = 5,
  OrderCancelled = 6,
  PriceChanged = 7,
  NewProduct = 8,
  PasswordReset = 9,
  AccountCreated = 10,
  System = 99,
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  typeName: string;
  title: string;
  body: string;
  referenceId: string | null;
  isRead: boolean;
  createdAtUtc: string;
  readAtUtc: string | null;
}

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}

/**
 * Helper functions for notification UI
 */
export function getNotificationSeverity(
  type: NotificationType
): 'success' | 'info' | 'warn' | 'error' {
  switch (type) {
    case NotificationType.OrderApproved:
    case NotificationType.OrderCompleted:
      return 'success';
    case NotificationType.OrderRejected:
    case NotificationType.OrderCancelled:
      return 'error';
    case NotificationType.OrderReady:
      return 'warn';
    default:
      return 'info';
  }
}

export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case NotificationType.OrderCreated:
      return 'pi pi-shopping-cart';
    case NotificationType.OrderApproved:
      return 'pi pi-check-circle';
    case NotificationType.OrderRejected:
      return 'pi pi-times-circle';
    case NotificationType.OrderReady:
      return 'pi pi-box';
    case NotificationType.OrderCompleted:
      return 'pi pi-verified';
    case NotificationType.OrderCancelled:
      return 'pi pi-ban';
    case NotificationType.PriceChanged:
      return 'pi pi-dollar';
    case NotificationType.NewProduct:
      return 'pi pi-star';
    case NotificationType.PasswordReset:
      return 'pi pi-key';
    case NotificationType.AccountCreated:
      return 'pi pi-user-plus';
    default:
      return 'pi pi-bell';
  }
}

export function getNotificationLink(notification: NotificationDto): string | null {
  if (!notification.referenceId) return null;

  if (notification.type <= NotificationType.OrderCancelled) {
    return `/orders/${notification.referenceId}`;
  }
  if (
    notification.type === NotificationType.PriceChanged ||
    notification.type === NotificationType.NewProduct
  ) {
    return `/products/${notification.referenceId}`;
  }
  return null;
}
