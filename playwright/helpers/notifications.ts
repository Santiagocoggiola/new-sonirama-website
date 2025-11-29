import { Page, expect } from '@playwright/test';

/**
 * Notification data
 */
export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
}

/**
 * Helper class for notification and WebSocket operations in tests
 */
export class NotificationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to notifications page
   */
  async navigateToNotifications(): Promise<void> {
    await this.page.goto('/notifications');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('notifications-list')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Get unread notifications count from bell badge
   */
  async getUnreadCount(isAdmin: boolean = false): Promise<number> {
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const badge = this.page.getByTestId(`${prefix}-notifications-badge`);
    
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await badge.textContent();
      return parseInt(text || '0', 10);
    }
    
    return 0;
  }

  /**
   * Open notifications panel
   */
  async openNotificationsPanel(isAdmin: boolean = false): Promise<void> {
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const bellButton = this.page.getByTestId(`${prefix}-navbar-notifications`);
    
    await bellButton.click();
    await this.page.waitForTimeout(300); // Wait for panel animation
    
    const panel = this.page.getByTestId(`${prefix}-notifications-panel`);
    await expect(panel).toBeVisible();
  }

  /**
   * Close notifications panel
   */
  async closeNotificationsPanel(): Promise<void> {
    // Click outside the panel to close it
    await this.page.locator('body').click({ position: { x: 10, y: 10 } });
    await this.page.waitForTimeout(300);
  }

  /**
   * Mark all notifications as read from panel
   */
  async markAllAsRead(isAdmin: boolean = false): Promise<void> {
    await this.openNotificationsPanel(isAdmin);
    
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const markAllBtn = this.page.getByTestId(`${prefix}-notifications-mark-all-read`);
    
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await this.page.waitForTimeout(500);
    }
    
    await this.closeNotificationsPanel();
  }

  /**
   * Mark all as read from notifications page
   */
  async markAllAsReadFromPage(): Promise<void> {
    await this.navigateToNotifications();
    
    const markAllBtn = this.page.getByTestId('notifications-list-mark-all-read');
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Click on a notification in the panel
   */
  async clickNotification(notificationId: string, isAdmin: boolean = false): Promise<void> {
    await this.openNotificationsPanel(isAdmin);
    
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const notification = this.page.getByTestId(`${prefix}-notifications-item-${notificationId}`);
    
    if (await notification.isVisible()) {
      await notification.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Wait for a new notification to appear
   */
  async waitForNotification(options?: {
    titleContains?: string;
    timeout?: number;
  }): Promise<void> {
    const timeout = options?.timeout || 30000;
    
    // Wait for toast notification
    const toast = this.page.getByTestId('global-toast').locator('.p-toast-message');
    
    await expect(toast).toBeVisible({ timeout });
    
    if (options?.titleContains) {
      await expect(toast).toContainText(options.titleContains);
    }
  }

  /**
   * Get notifications from panel
   */
  async getNotificationsFromPanel(isAdmin: boolean = false): Promise<NotificationData[]> {
    await this.openNotificationsPanel(isAdmin);
    
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const notifications: NotificationData[] = [];
    
    const items = this.page.locator(`[data-testid^="${prefix}-notifications-item-"]`);
    const count = await items.count();
    
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      const testId = await item.getAttribute('data-testid') || '';
      const id = testId.replace(`${prefix}-notifications-item-`, '');
      
      const title = await item.locator('h4, .notification-title').first().textContent() || '';
      const body = await item.locator('p, .notification-body').first().textContent() || '';
      
      const unreadIndicator = item.getByTestId(`${prefix}-notifications-item-${id}-unread`);
      const isRead = !(await unreadIndicator.isVisible().catch(() => false));
      
      notifications.push({ id, title: title.trim(), body: body.trim(), type: '', isRead });
    }
    
    await this.closeNotificationsPanel();
    return notifications;
  }

  /**
   * Navigate to view all notifications from panel
   */
  async viewAllFromPanel(isAdmin: boolean = false): Promise<void> {
    await this.openNotificationsPanel(isAdmin);
    
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const viewAllLink = this.page.getByTestId(`${prefix}-notifications-view-all`);
    
    if (await viewAllLink.isVisible()) {
      await viewAllLink.click();
      await this.page.waitForURL('/notifications');
    }
  }

  /**
   * Check if notifications panel shows empty state
   */
  async isPanelEmpty(isAdmin: boolean = false): Promise<boolean> {
    await this.openNotificationsPanel(isAdmin);
    
    const prefix = isAdmin ? 'admin' : 'dashboard';
    const emptyState = this.page.getByTestId(`${prefix}-notifications-empty`);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    await this.closeNotificationsPanel();
    return isEmpty;
  }
}

/**
 * WebSocket testing utilities
 */
export class WebSocketTestHelper {
  constructor(private page: Page) {}

  /**
   * Wait for SignalR connection to be established
   */
  async waitForConnection(timeout: number = 10000): Promise<void> {
    // Check for SignalR connection by looking at console or network
    // This is a simple approach - in real tests you might expose connection state
    await this.page.waitForTimeout(2000); // Give time for connection
  }

  /**
   * Setup listener for order events (for testing WebSocket)
   * Returns a promise that resolves when the event is received
   */
  async waitForOrderEvent(
    eventType: 'OrderCreated' | 'OrderUpdated',
    timeout: number = 30000
  ): Promise<void> {
    // Listen for toast notifications as indicator of WebSocket events
    const toast = this.page.getByTestId('global-toast').locator('.p-toast-message');
    
    const expectedText = eventType === 'OrderCreated' ? 
      /orden.*creada|nueva orden/i : 
      /orden.*actualizada/i;
    
    await expect(toast).toBeVisible({ timeout });
    await expect(toast).toContainText(expectedText, { timeout });
  }

  /**
   * Verify that the admin receives notification when user creates order
   * This requires two browser contexts - one for user, one for admin
   */
  async verifyAdminReceivesOrderNotification(
    userPage: Page,
    adminPage: Page,
    createOrderFn: () => Promise<void>
  ): Promise<boolean> {
    // Setup admin listener
    const adminNotificationPromise = adminPage
      .getByTestId('global-toast')
      .locator('.p-toast-message')
      .waitFor({ timeout: 30000 });
    
    // User creates order
    await createOrderFn();
    
    // Verify admin received notification
    try {
      await adminNotificationPromise;
      return true;
    } catch {
      return false;
    }
  }
}
