import { Page, expect, BrowserContext } from '@playwright/test';

/**
 * Test data interfaces
 */
export interface TestUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  firstName?: string;
  lastName?: string;
}

export interface TestProduct {
  name: string;
  description: string;
  price: number;
  category?: string;
  isActive: boolean;
}

export interface TestCategory {
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * Default test credentials
 */
export const TEST_ADMIN: TestUser = {
  email: process.env.ADMIN_EMAIL || 'admin@sonirama.com',
  password: process.env.ADMIN_PASSWORD || 'Admin123!',
  role: 'ADMIN',
  firstName: 'Admin',
  lastName: 'Sonirama',
};

/**
 * Authentication helper class
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login as a user
   */
  async login(user: TestUser): Promise<void> {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // Fill login form
    await this.page.getByTestId('login-form-email').fill(user.email);
    await this.page.getByTestId('login-form-password').fill(user.password);

    // Submit
    await this.page.getByTestId('login-form-submit').click();

    // Wait for navigation based on role
    if (user.role === 'ADMIN') {
      await expect(this.page).toHaveURL('/admin/products', { timeout: 15000 });
    } else {
      await expect(this.page).toHaveURL('/products', { timeout: 15000 });
    }

    // Verify we're logged in
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Login as admin
   */
  async loginAsAdmin(): Promise<void> {
    await this.login(TEST_ADMIN);
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Try admin navbar first, then regular user navbar
    const adminMenu = this.page.getByTestId('admin-navbar-user-menu');
    const userMenu = this.page.getByTestId('dashboard-navbar-user-menu');

    const menu = (await adminMenu.isVisible()) ? adminMenu : userMenu;
    await menu.click();

    // Click logout in the menu
    await this.page.getByText('Cerrar sesión').click();

    // Wait for redirect to login
    await expect(this.page).toHaveURL('/login', { timeout: 10000 });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    // Check for presence of user menu (either admin or dashboard)
    const adminMenu = this.page.getByTestId('admin-navbar-user-menu');
    const userMenu = this.page.getByTestId('dashboard-navbar-user-menu');
    
    return (await adminMenu.isVisible()) || (await userMenu.isVisible());
  }

  /**
   * Save authentication state to storage
   */
  async saveAuthState(path: string): Promise<void> {
    await this.page.context().storageState({ path });
  }
}

/**
 * Create authenticated context from storage state
 */
export async function createAuthenticatedContext(
  browser: import('@playwright/test').Browser,
  storageStatePath: string
): Promise<BrowserContext> {
  return browser.newContext({ storageState: storageStatePath });
}

/**
 * Wait for toast message
 */
export async function waitForToast(
  page: Page,
  options?: {
    severity?: 'success' | 'error' | 'info' | 'warn';
    textContains?: string;
  }
): Promise<void> {
  const toast = page.getByTestId('global-toast');
  await expect(toast).toBeVisible({ timeout: 10000 });

  if (options?.textContains) {
    await expect(toast).toContainText(options.textContains);
  }

  // Wait for toast to disappear
  await expect(toast.locator('.p-toast-message')).toBeHidden({ timeout: 10000 });
}

/**
 * Wait for loading state to finish
 */
export async function waitForLoadingToFinish(page: Page): Promise<void> {
  // Wait for any loading spinners to disappear
  const loadingSpinners = page.locator('[data-testid*="loading"]');
  const count = await loadingSpinners.count();
  
  for (let i = 0; i < count; i++) {
    const spinner = loadingSpinners.nth(i);
    if (await spinner.isVisible()) {
      await expect(spinner).toBeHidden({ timeout: 30000 });
    }
  }
}

/**
 * Generate unique test data names
 */
export function generateTestName(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Clean up test data by deleting items
 */
export async function cleanupByName(
  page: Page,
  type: 'product' | 'category',
  namePattern: string
): Promise<void> {
  // Navigate to the appropriate admin section
  const url = type === 'product' ? '/admin/products' : '/admin/categories';
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // Search for items matching the pattern
  const searchInput = page.getByTestId(
    type === 'product' ? 'admin-products-table-search' : 'admin-categories-table-search'
  );
  
  if (await searchInput.isVisible()) {
    await searchInput.fill(namePattern);
    await page.waitForTimeout(500); // Debounce
  }

  // Delete all matching items
  const rows = page.locator('tr').filter({ hasText: namePattern });
  const count = await rows.count();

  for (let i = count - 1; i >= 0; i--) {
    const row = rows.nth(i);
    const deleteBtn = row.locator('[data-testid*="delete"]');
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Confirm deletion if dialog appears
      const confirmBtn = page.getByText('Confirmar');
      if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      await waitForToast(page).catch(() => undefined);
    }
  }
}
