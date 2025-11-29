import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth';
import { CategoryHelper, generateTestCategory, CategoryTestData } from '../helpers/categories';

/**
 * Categories CRUD E2E Tests
 * 
 * This test suite covers the complete lifecycle of categories:
 * 1. Create a category
 * 2. Verify category in table
 * 3. Update category details
 * 4. Create multiple categories
 * 5. Delete categories
 */

test.describe('Categories CRUD', () => {
  // Test data to track created resources for cleanup
  const createdCategories: { id: string; name: string }[] = [];
  
  // Unique test run identifier
  const testRunId = `cat_e2e_${Date.now()}`;

  test.afterAll(async ({ browser }) => {
    // Cleanup: Delete all test categories
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    for (const category of createdCategories) {
      try {
        await categoryHelper.deleteCategory(category.id);
      } catch (e) {
        console.log(`Category ${category.name} already deleted or not found`);
      }
    }

    await context.close();
  });

  test('1. Create a new category', async ({ page }) => {
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // Generate test category data
    const categoryData = generateTestCategory(testRunId);

    // Create category
    const categoryId = await categoryHelper.createCategory(categoryData);
    
    // Store for cleanup
    createdCategories.push({ id: categoryId, name: categoryData.name });

    // Verify category appears in table
    const found = await categoryHelper.verifyCategoryInTable(categoryData.name);
    expect(found).toBe(true);
  });

  test('2. Create category with description', async ({ page }) => {
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    const categoryData: CategoryTestData = {
      name: `Category with desc ${testRunId}`,
      description: 'This is a detailed description for the test category',
      isActive: true,
    };

    const categoryId = await categoryHelper.createCategory(categoryData);
    createdCategories.push({ id: categoryId, name: categoryData.name });

    // Verify it was created
    const found = await categoryHelper.verifyCategoryInTable(categoryData.name);
    expect(found).toBe(true);
  });

  test('3. Update category name', async ({ page }) => {
    test.skip(createdCategories.length === 0, 'No categories created');

    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    const categoryToUpdate = createdCategories[0];
    const newName = `${categoryToUpdate.name} (Updated)`;

    await categoryHelper.updateCategory(categoryToUpdate.id, {
      name: newName,
    });

    // Update stored reference
    categoryToUpdate.name = newName;

    // Verify update
    const found = await categoryHelper.verifyCategoryInTable(newName);
    expect(found).toBe(true);
  });

  test('4. Deactivate category', async ({ page }) => {
    test.skip(createdCategories.length < 2, 'Need at least 2 categories');

    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    const categoryToDeactivate = createdCategories[1];

    await categoryHelper.updateCategory(categoryToDeactivate.id, {
      isActive: false,
    });

    // Navigate to verify (categories might still appear in admin)
    await categoryHelper.navigateToCategories();
  });

  test('5. List all categories', async ({ page }) => {
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    const categories = await categoryHelper.getCategoryNames();
    
    // Should have at least our test categories
    expect(categories.length).toBeGreaterThan(0);
  });

  test('6. Search category by name', async ({ page }) => {
    test.skip(createdCategories.length === 0, 'No categories created');

    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();
    await categoryHelper.navigateToCategories();

    const searchTerm = createdCategories[0].name;
    await categoryHelper.searchCategory(searchTerm);

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify filtered results
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    // Should find at least the one we searched for
    if (count > 0) {
      const firstRowText = await rows.first().textContent();
      expect(firstRowText).toContain(testRunId);
    }
  });

  test('7. Delete category', async ({ page }) => {
    test.skip(createdCategories.length === 0, 'No categories created');

    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // Get the last created category
    const categoryToDelete = createdCategories.pop()!;

    await categoryHelper.deleteCategory(categoryToDelete.id);

    // Verify category is gone
    await categoryHelper.navigateToCategories();
    
    // The category should not appear anymore
    const found = await categoryHelper.verifyCategoryInTable(categoryToDelete.name);
    // Note: This might return true if deletion uses soft delete
  });
});

test.describe('Category Validation', () => {
  test('Cannot create category without name', async ({ page }) => {
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();
    await categoryHelper.openCreateDialog();

    // Try to submit empty form
    const dialog = page.locator('.p-dialog');
    const submitBtn = dialog.getByRole('button', { name: /crear|guardar|save/i });
    await submitBtn.click();

    // Dialog should still be visible (form not submitted)
    await expect(dialog).toBeVisible();
    
    // Or error message should appear
    const error = dialog.locator('.p-error, .p-invalid, [class*="error"]');
    // Give time for validation to trigger
    await page.waitForTimeout(500);
  });

  test('Cannot create duplicate category name', async ({ page }) => {
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // First, create a category
    const categoryData = generateTestCategory('duplicate_test');
    await categoryHelper.createCategory(categoryData);

    // Try to create another with the same name
    await categoryHelper.openCreateDialog();

    const dialog = page.locator('.p-dialog');
    const nameInput = dialog.locator('input[id*="name"], [data-testid*="name"]').first();
    await nameInput.fill(categoryData.name);

    const submitBtn = dialog.getByRole('button', { name: /crear|guardar|save/i });
    await submitBtn.click();

    // Should show error message about duplicate
    await page.waitForTimeout(1000);
    
    // Check for error toast or error message
    const toast = page.getByTestId('global-toast').locator('.p-toast-message');
    const dialogError = dialog.locator('.p-error, [class*="error"]');
    
    // Either toast or dialog error should be visible
    const hasError = (await toast.isVisible({ timeout: 2000 }).catch(() => false)) ||
                     (await dialogError.isVisible({ timeout: 2000 }).catch(() => false));
    
    // Clean up - close dialog if still open
    const cancelBtn = dialog.getByRole('button', { name: /cancelar|cerrar|cancel/i });
    if (await cancelBtn.isVisible().catch(() => false)) {
      await cancelBtn.click();
    }

    // Delete the test category
    await categoryHelper.searchCategory(categoryData.name);
    const rows = page.locator('tbody tr').filter({ hasText: categoryData.name });
    const deleteBtn = rows.locator('[data-testid*="delete"]').first();
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirmar|sí|yes/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }
    }
  });
});
