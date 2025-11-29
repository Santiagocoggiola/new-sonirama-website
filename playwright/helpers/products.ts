import { Page, expect } from '@playwright/test';
import path from 'path';

/**
 * Product test data
 */
export interface ProductTestData {
  id?: string;
  name: string;
  description: string;
  price: number;
  category?: string;
  categoryId?: string;
  isActive: boolean;
}

/**
 * Helper class for product operations in tests
 */
export class ProductHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to admin products page
   */
  async navigateToProducts(): Promise<void> {
    await this.page.goto('/admin/products');
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('admin-products-table')).toBeVisible({ timeout: 15000 });
  }

  /**
   * Navigate to create product page
   */
  async navigateToCreateProduct(): Promise<void> {
    await this.navigateToProducts();
    await this.page.getByTestId('admin-products-table-create').click();
    await expect(this.page).toHaveURL('/admin/products/new');
    await expect(this.page.getByTestId('product-editor')).toBeVisible();
  }

  /**
   * Create a new product
   */
  async createProduct(product: ProductTestData): Promise<string> {
    await this.navigateToCreateProduct();

    // Fill product form
    await this.page.getByTestId('product-editor-name').fill(product.name);
    await this.page.getByTestId('product-editor-description').fill(product.description);
    
    // Price input - need to clear first
    const priceInput = this.page.getByTestId('product-editor-price').locator('input');
    await priceInput.click();
    await priceInput.fill(product.price.toString());

    // Select category if provided
    if (product.categoryId) {
      await this.page.getByTestId('product-editor-category').click();
      await this.page.waitForTimeout(300); // Wait for dropdown animation
      await this.page.locator('.p-dropdown-item').filter({ hasText: product.category || '' }).click();
    }

    // Set active status
    const isActiveSwitch = this.page.getByTestId('product-editor-isActive');
    const isCurrentlyActive = await isActiveSwitch.locator('input').isChecked();
    if (isCurrentlyActive !== product.isActive) {
      await isActiveSwitch.click();
    }

    // Submit form
    await this.page.getByTestId('product-editor-submit').click();

    // Wait for navigation back to products list
    await expect(this.page).toHaveURL('/admin/products', { timeout: 15000 });

    // Get the created product ID from the URL or table
    // Search for the product to get its ID
    await this.searchProduct(product.name);
    
    // Get the product row and extract ID from test-id
    const productRow = this.page.locator(`[data-testid^="admin-products-table-product-"]`).first();
    const testId = await productRow.getAttribute('data-testid');
    const productId = testId?.replace('admin-products-table-product-', '').split('-')[0] || '';

    return productId;
  }

  /**
   * Update an existing product
   */
  async updateProduct(productId: string, updates: Partial<ProductTestData>): Promise<void> {
    // Navigate to edit page
    await this.page.goto(`/admin/products/${productId}`);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('product-editor')).toBeVisible({ timeout: 15000 });

    // Update fields
    if (updates.name !== undefined) {
      const nameInput = this.page.getByTestId('product-editor-name');
      await nameInput.clear();
      await nameInput.fill(updates.name);
    }

    if (updates.description !== undefined) {
      const descInput = this.page.getByTestId('product-editor-description');
      await descInput.clear();
      await descInput.fill(updates.description);
    }

    if (updates.price !== undefined) {
      const priceInput = this.page.getByTestId('product-editor-price').locator('input');
      await priceInput.click({ clickCount: 3 }); // Select all
      await priceInput.fill(updates.price.toString());
    }

    if (updates.isActive !== undefined) {
      const isActiveSwitch = this.page.getByTestId('product-editor-isActive');
      const isCurrentlyActive = await isActiveSwitch.locator('input').isChecked();
      if (isCurrentlyActive !== updates.isActive) {
        await isActiveSwitch.click();
      }
    }

    // Submit
    await this.page.getByTestId('product-editor-submit').click();

    // Wait for navigation
    await expect(this.page).toHaveURL('/admin/products', { timeout: 15000 });
  }

  /**
   * Delete a product
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.navigateToProducts();

    // Find the product row and click delete
    const deleteBtn = this.page.getByTestId(`admin-products-table-product-${productId}-delete`);
    
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();

      // Confirm deletion
      const confirmDialog = this.page.locator('.p-confirmdialog, .p-dialog');
      if (await confirmDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmDialog.getByRole('button', { name: /confirmar|sí|yes|delete/i }).click();
      }

      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Search for a product
   */
  async searchProduct(query: string): Promise<void> {
    const searchInput = this.page.getByTestId('admin-products-table-search');
    await searchInput.clear();
    await searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Upload images to a product
   */
  async uploadImages(productId: string, imageFiles: string[]): Promise<void> {
    // Navigate to product edit page
    await this.page.goto(`/admin/products/${productId}`);
    await this.page.waitForLoadState('networkidle');

    // Find file input
    const fileInput = this.page.locator('input[type="file"]');
    
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Resolve absolute paths for images
      const absolutePaths = imageFiles.map(file => 
        path.isAbsolute(file) ? file : path.resolve(__dirname, '..', file)
      );
      
      await fileInput.setInputFiles(absolutePaths);
      
      // Wait for upload to complete
      await this.page.waitForTimeout(3000);
    }
  }

  /**
   * Verify product exists in the table
   */
  async verifyProductInTable(productName: string): Promise<boolean> {
    await this.navigateToProducts();
    await this.searchProduct(productName);
    
    const productCell = this.page.getByRole('cell', { name: productName });
    return productCell.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Get product data from the table
   */
  async getProductFromTable(productName: string): Promise<{ name: string; price: string; status: string } | null> {
    await this.navigateToProducts();
    await this.searchProduct(productName);
    
    const row = this.page.locator('tr').filter({ hasText: productName }).first();
    
    if (await row.isVisible({ timeout: 5000 }).catch(() => false)) {
      const cells = row.locator('td');
      return {
        name: await cells.nth(0).textContent() || '',
        price: await cells.nth(2).textContent() || '',
        status: await cells.nth(3).textContent() || '',
      };
    }
    
    return null;
  }
}

/**
 * Generate test product data
 */
export function generateTestProduct(suffix?: string): ProductTestData {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  const uniqueId = suffix || `${timestamp}_${random}`;
  
  return {
    name: `Test Product ${uniqueId}`,
    description: `This is a test product created for E2E testing - ${uniqueId}`,
    price: Math.floor(Math.random() * 10000) + 100,
    isActive: true,
  };
}
