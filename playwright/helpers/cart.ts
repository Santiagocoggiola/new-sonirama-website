import { Page, expect } from '@playwright/test';

/**
 * Cart item data
 */
export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
}

/**
 * Helper class for cart operations in tests
 */
export class CartHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to user cart
   */
  async navigateToCart(): Promise<void> {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Add product to cart from catalog
   */
  async addProductToCart(productId: string, quantity: number = 1): Promise<void> {
    // Navigate to product detail
    await this.page.goto(`/products/${productId}`);
    await this.page.waitForLoadState('networkidle');
    await expect(this.page.getByTestId('product-detail')).toBeVisible({ timeout: 15000 });

    // Set quantity if different from 1
    if (quantity > 1) {
      const quantityInput = this.page.getByTestId('product-detail-quantity').locator('input');
      await quantityInput.click({ clickCount: 3 });
      await quantityInput.fill(quantity.toString());
    }

    // Add to cart
    await this.page.getByTestId('product-detail-add-to-cart').click();

    // Wait for toast confirmation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Add product to cart from products grid (quick add)
   */
  async quickAddToCart(productId: string): Promise<void> {
    await this.page.goto('/products');
    await this.page.waitForLoadState('networkidle');

    const addButton = this.page.getByTestId(`product-card-${productId}-add-to-cart`);
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Get cart badge count
   */
  async getCartBadgeCount(): Promise<number> {
    const badge = this.page.getByTestId('dashboard-navbar-cart-badge');
    
    if (await badge.isVisible({ timeout: 2000 }).catch(() => false)) {
      const text = await badge.textContent();
      return parseInt(text || '0', 10);
    }
    
    return 0;
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(productId: string, newQuantity: number): Promise<void> {
    await this.navigateToCart();

    const quantityInput = this.page.getByTestId(`cart-item-${productId}-quantity`).locator('input');
    await quantityInput.click({ clickCount: 3 });
    await quantityInput.fill(newQuantity.toString());
    await quantityInput.press('Tab'); // Trigger blur to save

    await this.page.waitForTimeout(500);
  }

  /**
   * Remove item from cart
   */
  async removeItem(productId: string): Promise<void> {
    await this.navigateToCart();

    const removeBtn = this.page.getByTestId(`cart-item-${productId}-remove`);
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    await this.navigateToCart();

    const clearBtn = this.page.getByTestId('cart-view-clear');
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();

      // Confirm if dialog appears
      const confirmBtn = this.page.getByRole('button', { name: /confirmar|sí|yes/i });
      if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Proceed to checkout
   */
  async checkout(): Promise<string> {
    await this.navigateToCart();

    // Click checkout button
    await this.page.getByTestId('cart-view-checkout').click();

    // Wait for navigation to order page
    await this.page.waitForURL(/\/orders\/[a-z0-9-]+/, { timeout: 15000 });

    // Extract order ID from URL
    const url = this.page.url();
    const orderId = url.split('/orders/')[1] || '';

    return orderId;
  }

  /**
   * Get cart total
   */
  async getCartTotal(): Promise<number> {
    await this.navigateToCart();

    const totalElement = this.page.getByTestId('cart-view-total');
    if (await totalElement.isVisible()) {
      const text = await totalElement.textContent();
      // Parse price from text (remove currency symbols, etc.)
      const numericValue = text?.replace(/[^0-9.,]/g, '').replace(',', '.') || '0';
      return parseFloat(numericValue);
    }

    return 0;
  }

  /**
   * Check if cart is empty
   */
  async isCartEmpty(): Promise<boolean> {
    await this.navigateToCart();
    
    const emptyState = this.page.getByTestId('cart-view-empty');
    return emptyState.isVisible({ timeout: 5000 }).catch(() => false);
  }

  /**
   * Get all items in cart
   */
  async getCartItems(): Promise<CartItem[]> {
    await this.navigateToCart();

    const items: CartItem[] = [];
    const itemElements = this.page.locator('[data-testid^="cart-item-"]');
    const count = await itemElements.count();

    for (let i = 0; i < count; i++) {
      const item = itemElements.nth(i);
      const testId = await item.getAttribute('data-testid');
      const productId = testId?.replace('cart-item-', '').replace('-name', '').replace('-quantity', '').replace('-remove', '') || '';
      
      if (productId && !items.find(x => x.productId === productId)) {
        const nameElement = this.page.getByTestId(`cart-item-${productId}-name`);
        const quantityInput = this.page.getByTestId(`cart-item-${productId}-quantity`).locator('input');
        
        const name = await nameElement.textContent() || '';
        const quantity = parseInt(await quantityInput.inputValue() || '1', 10);
        
        items.push({ productId, productName: name, quantity });
      }
    }

    return items;
  }
}
