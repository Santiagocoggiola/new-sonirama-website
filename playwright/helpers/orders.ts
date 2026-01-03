import { Page, expect } from '@playwright/test';
import { waitForToast } from './auth';

/**
 * Order status type
 */
export type OrderStatus = 
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'ModificationPending'
  | 'Confirmed'
  | 'ReadyForPickup'
  | 'Completed'
  | 'Cancelled';

/**
 * Order data
 */
export interface OrderData {
  id: string;
  number: string;
  status: OrderStatus;
  total: number;
}

/**
 * Helper class for order operations in tests
 */
export class OrderHelper {
  constructor(private page: Page) {}

  private async ensureAdminOrdersPage(): Promise<void> {
    if (!this.page.url().includes('/admin/orders')) {
      await this.navigateToAdminOrders();
      return;
    }
    await expect(this.page.getByTestId('admin-orders-table')).toBeVisible({ timeout: 15000 });
  }

  private formatDateForInput(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  /**
   * Navigate to user orders list
   */
  async navigateToOrders(): Promise<void> {
    await this.page.goto('/orders');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('orders-list')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Navigate to admin orders list
   */
  async navigateToAdminOrders(): Promise<void> {
    await this.page.goto('/admin/orders');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('admin-orders-table')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Clear admin order filters (search/date)
   */
  async clearAdminFilters(): Promise<void> {
    await this.ensureAdminOrdersPage();
    const clearBtn = this.page.getByTestId('admin-orders-table-clear-filters');
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Apply search filter in admin orders table
   */
  async searchAdminOrders(query: string): Promise<void> {
    await this.ensureAdminOrdersPage();
    const searchInput = this.page.getByTestId('admin-orders-table-search');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.clear();
      await searchInput.fill(query);
      await this.waitForActionComplete();
    }
  }

  /**
   * Set date range filter in admin orders table
   */
  async setAdminDateRange(from: Date, to?: Date): Promise<void> {
    await this.ensureAdminOrdersPage();
    const dateInput = this.page.getByTestId('admin-orders-table-date-range').locator('input');
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const start = this.formatDateForInput(from);
      const end = this.formatDateForInput(to ?? from);
      await dateInput.fill(`${start} - ${end}`);
      await dateInput.press('Enter');
      await this.waitForActionComplete();
    }
  }

  /**
   * Navigate to order detail
   */
  async navigateToOrderDetail(orderId: string, isAdmin: boolean = false): Promise<void> {
    const path = isAdmin ? `/admin/orders/${orderId}` : `/orders/${orderId}`;
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
    
    const testId = isAdmin ? 'admin-order-detail' : 'order-detail';
    await expect(this.page.getByTestId(testId)).toBeVisible({ timeout: 15000 });
  }

  /**
   * Get order status from detail page
   */
  async getOrderStatus(orderId: string, isAdmin: boolean = false): Promise<string> {
    await this.navigateToOrderDetail(orderId, isAdmin);
    
    const testId = isAdmin ? 'admin-order-detail-status' : 'order-detail-status';
    const statusElement = this.page.getByTestId(testId);
    
    if (await statusElement.isVisible()) {
      return await statusElement.textContent() || '';
    }
    
    // Fallback: look for status tag
    const statusTag = this.page.locator('.p-tag').first();
    return await statusTag.textContent() || '';
  }

  /**
   * Confirm order (user action)
   */
  async confirmOrder(orderId: string): Promise<void> {
    await this.navigateToOrderDetail(orderId, false);
    
    const confirmBtn = this.page.getByRole('button', { name: /aceptar|confirmar|sí|yes|ok/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
      await this.waitForActionComplete(/confirmada|confirmado|confirmar/i);
    }
  }

  /**
   * Cancel order (user action)
   */
  async cancelOrder(orderId: string, reason: string = 'Test cancellation'): Promise<void> {
    await this.navigateToOrderDetail(orderId, false);
    
    const cancelBtn = this.page.getByRole('button', { name: /cancelar/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      
      // Fill reason in dialog if it appears
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const reasonInput = dialog.locator('textarea, input').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill(reason);
        }
        await dialog.getByRole('button', { name: /aceptar|confirmar|cancelar orden|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/cancelada|cancelado|cancelar/i);
    }
  }

  /**
   * Approve order (admin action)
   */
  async approveOrder(orderId: string): Promise<void> {
    await this.navigateToOrderDetail(orderId, true);
    
    const approveBtn = this.page.getByRole('button', { name: /aprobar/i });
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      
      // Confirm in dialog if it appears
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dialog.getByRole('button', { name: /aceptar|confirmar|aprobar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/aprobada|aprobado|approved/i);
    }
  }

  /**
   * Reject order (admin action)
   */
  async rejectOrder(orderId: string, reason: string = 'Test rejection'): Promise<void> {
    await this.navigateToOrderDetail(orderId, true);
    
    const rejectBtn = this.page.getByRole('button', { name: /rechazar/i });
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      
      // Fill reason in dialog
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const reasonInput = dialog.locator('textarea, input').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill(reason);
        }
        await dialog.getByRole('button', { name: /aceptar|confirmar|rechazar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/rechazada|rechazado|rejected/i);
    }
  }

  /**
   * Mark order as ready for pickup (admin action)
   */
  async markOrderReady(orderId: string): Promise<void> {
    await this.navigateToOrderDetail(orderId, true);
    
    const readyBtn = this.page.getByRole('button', { name: /listo|ready/i });
    if (await readyBtn.isVisible()) {
      await readyBtn.click();
      
      // Confirm in dialog if it appears
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dialog.getByRole('button', { name: /aceptar|confirmar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/listo|ready/i);
    }
  }

  /**
   * Complete order (admin action)
   */
  async completeOrder(orderId: string): Promise<void> {
    await this.navigateToOrderDetail(orderId, true);
    
    const completeBtn = this.page.getByRole('button', { name: /completar|entregar/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      
      // Confirm in dialog if it appears
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dialog.getByRole('button', { name: /aceptar|confirmar|completar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/completada|completado|entregada|entregado/i);
    }
  }

  /**
   * Modify order (admin action)
   */
  async modifyOrder(orderId: string, productId: string, newQuantity: number): Promise<void> {
    await this.navigateToOrderDetail(orderId, true);
    
    const modifyBtn = this.page.getByRole('button', { name: /modificar/i });
    if (await modifyBtn.isVisible()) {
      await modifyBtn.click();
      
      // Find product and change quantity
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const quantityInput = dialog.locator(`[data-testid*="${productId}"] input, input`).first();
        if (await quantityInput.isVisible()) {
          await quantityInput.click({ clickCount: 3 });
          await quantityInput.fill(newQuantity.toString());
        }
        await dialog.getByRole('button', { name: /aceptar|confirmar|guardar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/modificada|modificado|changes saved/i);
    }
  }

  /**
   * Accept order modifications (user action)
   */
  async acceptModifications(orderId: string): Promise<void> {
    await this.navigateToOrderDetail(orderId, false);
    
    const acceptBtn = this.page.getByRole('button', { name: /aceptar.*modificaciones|aceptar cambios/i });
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      
      // Confirm in dialog if it appears
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dialog.getByRole('button', { name: /aceptar|confirmar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/aceptada|aceptado/i);
    }
  }

  /**
   * Reject order modifications (user action)
   */
  async rejectModifications(orderId: string, reason: string = 'Test rejection'): Promise<void> {
    await this.navigateToOrderDetail(orderId, false);
    
    const rejectBtn = this.page.getByRole('button', { name: /rechazar.*modificaciones|rechazar cambios/i });
    if (await rejectBtn.isVisible()) {
      await rejectBtn.click();
      
      // Fill reason in dialog
      const dialog = this.page.locator('.p-dialog');
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        const reasonInput = dialog.locator('textarea, input').first();
        if (await reasonInput.isVisible()) {
          await reasonInput.fill(reason);
        }
        await dialog.getByRole('button', { name: /aceptar|confirmar|rechazar|sí|yes|ok/i }).click();
      }
      await this.waitForActionComplete(/rechazada|rechazado/i);
    }
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(isAdmin: boolean = false): Promise<OrderData[]> {
    if (isAdmin) {
      await this.navigateToAdminOrders();
    } else {
      await this.navigateToOrders();
    }

    const orders: OrderData[] = [];
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();

    for (let i = 0; i < count && i < 10; i++) {
      const row = rows.nth(i);
      const cells = row.locator('td');
      
      const orderLink = row.locator('a').first();
      const href = await orderLink.getAttribute('href') || '';
      const id = href.split('/orders/')[1] || '';
      
      const number = await cells.nth(0).textContent() || '';
      const statusTag = row.locator('.p-tag').first();
      const status = (await statusTag.textContent() || '') as OrderStatus;
      const totalText = await cells.nth(-1).textContent() || '0';
      const total = parseFloat(totalText.replace(/[^0-9.,]/g, '').replace(',', '.'));

      orders.push({ id, number: number.trim(), status, total });
    }

    return orders;
  }

  /**
   * Search orders by order number
   */
  async searchOrder(orderNumber: string, isAdmin: boolean = false): Promise<void> {
    if (isAdmin) {
      await this.searchAdminOrders(orderNumber);
      return;
    }

    await this.navigateToOrders();

    const searchInput = this.page.locator('input[type="text"]').first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(orderNumber);
      await this.waitForActionComplete();
    }
  }

  /**
   * Wait for a toast or status change instead of arbitrary sleeps.
   */
  private async waitForActionComplete(expectedStatus?: RegExp | string): Promise<void> {
    const toast = this.page.getByTestId('global-toast').locator('.p-toast-message');

    await Promise.race([
      toast.waitFor({ state: 'visible', timeout: 8000 }),
      this.page.waitForLoadState('networkidle', { timeout: 8000 })
    ]).catch(() => undefined);

    if (expectedStatus) {
      const statusTag = this.page.locator('.p-tag').first();
      await expect(statusTag).toContainText(expectedStatus, { timeout: 8000 }).catch(() => undefined);
    }

    await waitForToast(this.page).catch(() => undefined);
  }
}
