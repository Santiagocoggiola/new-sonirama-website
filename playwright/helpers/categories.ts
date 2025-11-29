import { Page, expect } from '@playwright/test';

/**
 * Category test data
 */
export interface CategoryTestData {
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
}

/**
 * Helper class for category operations in tests
 */
export class CategoryHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to admin categories page
   */
  async navigateToCategories(): Promise<void> {
    await this.page.goto('/admin/categories');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('admin-categories-table')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Open create category dialog
   */
  async openCreateDialog(): Promise<void> {
    await this.navigateToCategories();
    await this.page.getByTestId('admin-categories-table-create').click();
    await this.page.waitForTimeout(300); // Wait for dialog animation
  }

  /**
   * Create a new category
   */
  async createCategory(category: CategoryTestData): Promise<string> {
    await this.openCreateDialog();

    // Fill category form in dialog
    const dialog = this.page.locator('.p-dialog');
    await expect(dialog).toBeVisible();

    // Fill name
    const nameInput = dialog.locator('input[id*="name"], [data-testid*="name"]').first();
    await nameInput.fill(category.name);

    // Fill description if provided
    if (category.description) {
      const descInput = dialog.locator('textarea, [data-testid*="description"]').first();
      if (await descInput.isVisible()) {
        await descInput.fill(category.description);
      }
    }

    // Set active status if there's a toggle
    const activeSwitch = dialog.locator('.p-inputswitch');
    if (await activeSwitch.isVisible()) {
      const isCurrentlyActive = await activeSwitch.locator('input').isChecked();
      if (isCurrentlyActive !== category.isActive) {
        await activeSwitch.click();
      }
    }

    // Submit form
    const submitBtn = dialog.getByRole('button', { name: /crear|guardar|save|submit/i });
    await submitBtn.click();

    // Wait for dialog to close
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // Search for the created category to get its ID
    await this.page.waitForTimeout(500);
    await this.searchCategory(category.name);

    // Try to extract ID from the row
    const categoryRow = this.page.locator(`[data-testid^="admin-categories-table-category-"]`).first();
    const testId = await categoryRow.getAttribute('data-testid').catch(() => null);
    const categoryId = testId?.replace('admin-categories-table-category-', '').split('-')[0] || '';

    return categoryId;
  }

  /**
   * Update an existing category
   */
  async updateCategory(categoryId: string, updates: Partial<CategoryTestData>): Promise<void> {
    await this.navigateToCategories();

    // Click edit button for the category
    const editBtn = this.page.getByTestId(`admin-categories-table-category-${categoryId}-edit`);
    
    if (await editBtn.isVisible({ timeout: 5000 })) {
      await editBtn.click();
    } else {
      // Try to find by row content
      const row = this.page.locator('tr').filter({ hasText: categoryId }).first();
      await row.locator('[data-testid*="edit"]').click();
    }

    // Wait for dialog
    const dialog = this.page.locator('.p-dialog');
    await expect(dialog).toBeVisible();

    // Update fields
    if (updates.name !== undefined) {
      const nameInput = dialog.locator('input[id*="name"], [data-testid*="name"]').first();
      await nameInput.clear();
      await nameInput.fill(updates.name);
    }

    if (updates.description !== undefined) {
      const descInput = dialog.locator('textarea, [data-testid*="description"]').first();
      if (await descInput.isVisible()) {
        await descInput.clear();
        await descInput.fill(updates.description);
      }
    }

    if (updates.isActive !== undefined) {
      const activeSwitch = dialog.locator('.p-inputswitch');
      if (await activeSwitch.isVisible()) {
        const isCurrentlyActive = await activeSwitch.locator('input').isChecked();
        if (isCurrentlyActive !== updates.isActive) {
          await activeSwitch.click();
        }
      }
    }

    // Submit
    const submitBtn = dialog.getByRole('button', { name: /actualizar|guardar|save|update/i });
    await submitBtn.click();

    // Wait for dialog to close
    await expect(dialog).toBeHidden({ timeout: 10000 });
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await this.navigateToCategories();

    // Find and click delete button
    const deleteBtn = this.page.getByTestId(`admin-categories-table-category-${categoryId}-delete`);
    
    if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteBtn.click();

      // Confirm deletion
      const confirmDialog = this.page.locator('.p-confirmdialog, .p-dialog');
      if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmDialog.getByRole('button', { name: /confirmar|sí|yes|delete|eliminar/i }).click();
      }

      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Search for a category
   */
  async searchCategory(query: string): Promise<void> {
    const searchInput = this.page.getByTestId('admin-categories-table-search');
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.clear();
      await searchInput.fill(query);
      await this.page.waitForTimeout(500); // Debounce
    }
  }

  /**
   * Verify category exists in the table
   */
  async verifyCategoryInTable(categoryName: string): Promise<boolean> {
    await this.navigateToCategories();
    await this.searchCategory(categoryName);
    
    const categoryCell = this.page.getByRole('cell', { name: categoryName });
    return categoryCell.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Get all categories from the table
   */
  async getCategoryNames(): Promise<string[]> {
    await this.navigateToCategories();
    
    const names: string[] = [];
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      const nameCell = rows.nth(i).locator('td').first();
      const text = await nameCell.textContent();
      if (text) names.push(text.trim());
    }
    
    return names;
  }
}

/**
 * Generate test category data
 */
export function generateTestCategory(suffix?: string): CategoryTestData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const uniqueId = suffix || `${timestamp}_${random}`;
  
  return {
    name: `Test Category ${uniqueId}`,
    description: `Test category description - ${uniqueId}`,
    isActive: true,
  };
}
