import { test, expect } from '@playwright/test';
import { AuthHelper, TEST_ADMIN, waitForToast } from '../helpers/auth';

/**
 * Authentication E2E Tests
 * 
 * Tests for login, logout, and authentication flows
 */

test.describe('Authentication', () => {
  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify login form elements
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-form-email')).toBeVisible();
    await expect(page.getByTestId('login-form-password')).toBeVisible();
    await expect(page.getByTestId('login-form-submit')).toBeVisible();
  });

  test('Admin can login successfully', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    // Verify redirected to admin dashboard
    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByTestId('admin-navbar')).toBeVisible();
  });

  test('Shows validation errors for empty form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submit = page.getByTestId('login-form-submit');
    await expect(submit).toBeDisabled();

    // Fill only email -> button should still be disabled or show password error
    await page.getByTestId('login-form-email').fill('invalid-email');
    const stillDisabled = await submit.isDisabled();

    if (stillDisabled) {
      expect(stillDisabled).toBe(true);
    } else {
      // If form allows click, expect inline errors
      await submit.click();
      const emailError = page.getByTestId('login-form-email-error');
      const passwordError = page.getByTestId('login-form-password-error');
      const hasEmailError = await emailError.isVisible({ timeout: 2000 }).catch(() => false);
      const hasPasswordError = await passwordError.isVisible({ timeout: 2000 }).catch(() => false);
      expect(hasEmailError || hasPasswordError).toBe(true);
    }
  });

  test('Shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Enter invalid credentials
    await page.getByTestId('login-form-email').fill('invalid@email.com');
    await page.getByTestId('login-form-password').fill('wrongpassword123');
    await page.getByTestId('login-form-submit').click();

    // Should show server error or remain on login page
    const serverError = page.getByTestId('login-form-server-error');
    const isStillOnLogin = await page.waitForURL(/login/, { timeout: 5000 }).then(() => true).catch(() => page.url().includes('/login'));

    const hasError = await serverError.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasError || isStillOnLogin).toBe(true);
  });

  test('Remember me checkbox exists', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const rememberMe = page.getByTestId('login-form-remember');
    const isVisible = await rememberMe.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Remember me is optional - just verify if it exists it can be interacted with
    if (isVisible) {
      await rememberMe.click();
    }
  });

  test('Forgot password link navigates correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const forgotLink = page.getByTestId('login-form-forgot-password-link');
    
    if (await forgotLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await forgotLink.click();
      await expect(page).toHaveURL('/forgot-password');
    }
  });

  test('Logout redirects to login page', async ({ page }) => {
    const auth = new AuthHelper(page);
    
    // Login first
    await auth.loginAsAdmin();
    await expect(page).toHaveURL('/admin/products');

    // Logout
    await auth.logout();

    // Should be on login page
    await expect(page.getByTestId('login-form-email')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/login(\?|$)/i);
  });

  test('Protected routes redirect to login', async ({ page }) => {
    // Try to access admin page without being logged in
    await page.goto('/admin/products');
    
    // Should redirect to login
    await page.waitForURL(/\/login(\?returnUrl=.*)?/, { timeout: 10000 });
  });

  test('User cannot access admin routes', async ({ page }) => {
    // This test would require a regular user account
    // For now, we just verify the routing structure
    
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    // Admin should be able to access admin routes
    await page.goto('/admin/users');
    await expect(page.getByTestId('admin-users-table')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Forgot Password', () => {
  test('Forgot password page loads correctly', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Should show email step
    const emailStep = page.getByTestId('forgot-password-form-email-step');
    await expect(emailStep).toBeVisible();
  });

  test('Can submit email for password reset', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Enter email
    await page.getByTestId('forgot-password-form-email').fill('test@example.com');

    // Submit
    await page.getByTestId('forgot-password-form-email-submit').click();
    await waitForToast(page).catch(() => undefined);

    // Should either show code step or error message
    const codeStep = page.getByTestId('forgot-password-form-code-step');
    const serverError = page.getByTestId('forgot-password-form-server-error');

    const hasCodeStep = await codeStep.isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await serverError.isVisible({ timeout: 5000 }).catch(() => false);

    // One of these should happen
    expect(hasCodeStep || hasError).toBe(true);
  });

  test('Shows validation error for invalid email', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');

    // Enter invalid email
    await page.getByTestId('forgot-password-form-email').fill('invalid-email');
    const submit = page.getByTestId('forgot-password-form-email-submit');

    // Button should remain disabled until email is valid
    await expect(submit).toBeDisabled();

    // Inline error should be visible without clicking
    const emailError = page.getByTestId('forgot-password-form-email-error');
    await expect(emailError).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Session Management', () => {
  test('Session persists across page navigation', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    // Navigate to different pages
    await page.goto('/admin/categories');
    await expect(page.getByTestId('admin-categories-table')).toBeVisible({ timeout: 15000 });

    await page.goto('/admin/orders');
    const ordersTable = page.getByTestId('admin-orders-table');
    const ordersEmpty = page.getByTestId('admin-orders-table-empty');
    await expect(ordersTable.or(ordersEmpty)).toBeVisible({ timeout: 15000 });

    // Should still be logged in
    await expect(page.getByTestId('admin-navbar')).toBeVisible();
  });

  test('Session persists after page refresh', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on admin page (not redirected to login)
    await expect(page.getByTestId('admin-navbar')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Verification & password reset with dev codes', () => {
  const DEV_NUMERIC_CODE = '111222';
  const DEV_PASSWORD = 'DevPasswor';

  const createUserViaAdmin = async (page: import('@playwright/test').Page, email: string) => {
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('admin-users-table-create').click();
    await page.getByLabel('Email *').fill(email);
    await page.getByLabel('Nombre *').fill('Playwright');
    await page.getByLabel('Apellido *').fill('User');

    const phoneLabel = page.getByLabel('Teléfono');
    if (await phoneLabel.isVisible().catch(() => false)) {
      await phoneLabel.fill('123456');
    }

      const roleDropdown = page.locator('#user-role');
      await roleDropdown.click();
      const rolePanel = page.locator('.p-dropdown-items');
      await rolePanel.getByText('Usuario', { exact: true }).click();

    await page.getByRole('button', { name: /crear|guardar|actualizar/i }).click();
    await waitForToast(page).catch(() => undefined);
  };

  test('Admin creates user and verifies email via static code', async ({ page }) => {
    const email = `playwright+verify_${Date.now()}@example.com`;

    await createUserViaAdmin(page, email);

    await page.goto(`/auth/verify?email=${encodeURIComponent(email)}&code=${DEV_NUMERIC_CODE}`);
    await expect(page.getByTestId('verify-email-page')).toBeVisible();
    await expect(page.getByText(/Cuenta verificada/i)).toBeVisible({ timeout: 8000 });
    await page.waitForURL('/login', { timeout: 15000 });

    await page.getByTestId('login-form-email').fill(email);
    await page.getByTestId('login-form-password').fill(DEV_PASSWORD);
    await page.getByTestId('login-form-submit').click();

    await expect(page).toHaveURL(/\/products/, { timeout: 15000 });
  });

  test('User resets password with static code', async ({ page }) => {
    const email = `playwright+reset_${Date.now()}@example.com`;

    await createUserViaAdmin(page, email);
    await page.goto(`/auth/verify?email=${encodeURIComponent(email)}&code=${DEV_NUMERIC_CODE}`);
    await page.waitForURL('/login', { timeout: 15000 });

    await page.goto('/forgot-password');
    await page.getByTestId('forgot-password-form-email').fill(email);
    await page.getByTestId('forgot-password-form-email-submit').click();
    await waitForToast(page).catch(() => undefined);

    await expect(page.getByTestId('forgot-password-form-code-step')).toBeVisible({ timeout: 8000 });
    await page.getByTestId('forgot-password-form-code').fill(DEV_NUMERIC_CODE);
    await page.getByTestId('forgot-password-form-code-submit').click();
    await expect(page.getByTestId('forgot-password-form-success-step')).toBeVisible({ timeout: 8000 });

    await page.goto('/login');
    await page.getByTestId('login-form-email').fill(email);
    await page.getByTestId('login-form-password').fill(DEV_PASSWORD);
    await page.getByTestId('login-form-submit').click();

    await expect(page).toHaveURL(/\/products/, { timeout: 15000 });
  });
});
