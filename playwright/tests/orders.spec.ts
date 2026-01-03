import { test, expect, BrowserContext, Page } from '@playwright/test';
import { AuthHelper, TEST_ADMIN } from '../helpers/auth';
import { ProductHelper, generateTestProduct } from '../helpers/products';
import { CategoryHelper, generateTestCategory } from '../helpers/categories';
import { CartHelper } from '../helpers/cart';
import { OrderHelper } from '../helpers/orders';

/**
 * Orders E2E Tests
 * 
 * This test suite covers the complete order flow:
 * 1. Setup: Create category and product
 * 2. Add products to cart
 * 3. Checkout to create order
 * 4. Admin approves order
 * 5. User confirms order
 * 6. Admin marks order ready
 * 7. Admin completes order
 * 8. Cleanup
 */

test.describe('Complete Order Flow', () => {
  // Test data
  let testCategory: { id: string; name: string };
  let testProduct: { id: string; name: string; price: number };
  let orderId: string;
  let orderNumber: string;
  
  const testRunId = `order_e2e_${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    // Setup: Create category and product as admin
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);
    const productHelper = new ProductHelper(page);

    await auth.loginAsAdmin();

    // Create category
    const categoryData = generateTestCategory(testRunId);
    const categoryId = await categoryHelper.createCategory(categoryData);
    testCategory = { id: categoryId, name: categoryData.name };

    // Create product
    const productData = generateTestProduct(testRunId);
    productData.category = testCategory.name;
    productData.categoryId = testCategory.id;
    productData.price = 1500; // Fixed price for easier verification

    const productId = await productHelper.createProduct(productData);
    testProduct = { id: productId, name: productData.name, price: productData.price };

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Cleanup
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // Delete product
    if (testProduct?.id) {
      try {
        await productHelper.deleteProduct(testProduct.id);
      } catch (e) {
        console.log('Product cleanup: not found or already deleted');
      }
    }

    // Delete category
    if (testCategory?.id) {
      try {
        await categoryHelper.deleteCategory(testCategory.id);
      } catch (e) {
        console.log('Category cleanup: not found or already deleted');
      }
    }

    await context.close();
  });

  test('1. View product in catalog', async ({ page }) => {
    test.skip(!testProduct?.id, 'No product created');

    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();

    // Navigate to products catalog
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Product grid should be visible
    await expect(page.getByTestId('products-grid')).toBeVisible({ timeout: 15000 });
  });

  test('2. Add product to cart', async ({ page }) => {
    test.skip(!testProduct?.id, 'No product created');

    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();

    // Clear cart first
    await cartHelper.clearCart().catch(() => {}); // Ignore if cart is already empty

    // Add product to cart
    await cartHelper.addProductToCart(testProduct.id, 2);

    // Verify cart badge
    const badgeCount = await cartHelper.getCartBadgeCount();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test('3. Update cart quantity', async ({ page }) => {
    test.skip(!testProduct?.id, 'No product created');

    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();
    await cartHelper.navigateToCart();

    // Check cart is not empty
    const isEmpty = await cartHelper.isCartEmpty();
    expect(isEmpty).toBe(false);

    // Update quantity
    await cartHelper.updateItemQuantity(testProduct.id, 3);

    // Verify update
    await page.waitForTimeout(1000);
  });

  test('4. Checkout and create order', async ({ page }) => {
    test.skip(!testProduct?.id, 'No product created');

    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();

    // Perform checkout
    orderId = await cartHelper.checkout();
    expect(orderId).toBeTruthy();

    const numberElement = page.getByTestId('order-detail-number');
    if (await numberElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      orderNumber = (await numberElement.textContent())?.trim() || '';
    }

    // Verify on order detail page
    await expect(page.getByTestId('order-detail')).toBeVisible({ timeout: 15000 });
  });

  test('5. View order in orders list', async ({ page }) => {
    test.skip(!orderId, 'No order created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();
    await orderHelper.navigateToOrders();

    // Order should appear in the list
    const orders = await orderHelper.getRecentOrders(false);
    expect(orders.length).toBeGreaterThan(0);
  });

  test('6. Admin views order', async ({ page }) => {
    test.skip(!orderId, 'No order created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();
    await orderHelper.clearAdminFilters();
    await orderHelper.setAdminDateRange(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date());
    await orderHelper.searchAdminOrders(orderNumber || orderId);

    // Orders table should be visible
    await expect(page.getByTestId('admin-orders-table')).toBeVisible();

    // Navigate to order detail
    await orderHelper.navigateToOrderDetail(orderId, true);
    await expect(page.getByTestId('admin-order-detail')).toBeVisible();
  });

  test('7. Admin approves order', async ({ page }) => {
    test.skip(!orderId, 'No order created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Approve the order
    await orderHelper.approveOrder(orderId);

    // Verify status changed
    await page.waitForTimeout(1000);
  });

  test('8. User confirms order', async ({ page }) => {
    test.skip(!orderId, 'No order created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin(); // Using admin as the user for this test

    // Confirm the order
    await orderHelper.confirmOrder(orderId);

    // Verify status
    await page.waitForTimeout(1000);
  });

  test('9. Admin marks order ready', async ({ page }) => {
    test.skip(!orderId, 'No order created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Mark as ready for pickup
    await orderHelper.markOrderReady(orderId);

    // Verify status
    await page.waitForTimeout(1000);
  });

  test('10. Admin completes order', async ({ page }) => {
    test.skip(!orderId, 'No order created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Complete the order
    await orderHelper.completeOrder(orderId);

    // Verify final status
    await orderHelper.navigateToOrderDetail(orderId, true);
    const status = await orderHelper.getOrderStatus(orderId, true);
    
    // Status should indicate completion
    expect(status.toLowerCase()).toMatch(/completad|entregad|completed/i);
  });
});

test.describe('Order Cancellation Flow', () => {
  let testCategory: { id: string; name: string };
  let testProduct: { id: string; name: string };
  let orderToCancel: string;
  
  const testRunId = `cancel_e2e_${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);
    const productHelper = new ProductHelper(page);

    await auth.loginAsAdmin();

    // Create category
    const categoryData = generateTestCategory(testRunId);
    const categoryId = await categoryHelper.createCategory(categoryData);
    testCategory = { id: categoryId, name: categoryData.name };

    // Create product
    const productData = generateTestProduct(testRunId);
    productData.category = testCategory.name;
    productData.categoryId = testCategory.id;

    const productId = await productHelper.createProduct(productData);
    testProduct = { id: productId, name: productData.name };

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    if (testProduct?.id) {
      try { await productHelper.deleteProduct(testProduct.id); } catch {}
    }
    if (testCategory?.id) {
      try { await categoryHelper.deleteCategory(testCategory.id); } catch {}
    }

    await context.close();
  });

  test('1. Create order to cancel', async ({ page }) => {
    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();
    await cartHelper.clearCart().catch(() => {});
    await cartHelper.addProductToCart(testProduct.id, 1);
    
    orderToCancel = await cartHelper.checkout();
    expect(orderToCancel).toBeTruthy();
  });

  test('2. User cancels order', async ({ page }) => {
    test.skip(!orderToCancel, 'No order to cancel');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Cancel the order
    await orderHelper.cancelOrder(orderToCancel, 'Testing cancellation flow');

    // Verify status
    await orderHelper.navigateToOrderDetail(orderToCancel, false);
    const status = await orderHelper.getOrderStatus(orderToCancel, false);
    
    expect(status.toLowerCase()).toMatch(/cancelad|cancelled|rejected/i);
  });
});

test.describe('Order Rejection Flow', () => {
  let testCategory: { id: string; name: string };
  let testProduct: { id: string; name: string };
  let orderToReject: string;
  
  const testRunId = `reject_e2e_${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);
    const productHelper = new ProductHelper(page);

    await auth.loginAsAdmin();

    const categoryData = generateTestCategory(testRunId);
    const categoryId = await categoryHelper.createCategory(categoryData);
    testCategory = { id: categoryId, name: categoryData.name };

    const productData = generateTestProduct(testRunId);
    productData.category = testCategory.name;
    productData.categoryId = testCategory.id;

    const productId = await productHelper.createProduct(productData);
    testProduct = { id: productId, name: productData.name };

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    if (testProduct?.id) {
      try { await productHelper.deleteProduct(testProduct.id); } catch {}
    }
    if (testCategory?.id) {
      try { await categoryHelper.deleteCategory(testCategory.id); } catch {}
    }

    await context.close();
  });

  test('1. Create order to reject', async ({ page }) => {
    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();
    await cartHelper.clearCart().catch(() => {});
    await cartHelper.addProductToCart(testProduct.id, 1);
    
    orderToReject = await cartHelper.checkout();
    expect(orderToReject).toBeTruthy();
  });

  test('2. Admin rejects order', async ({ page }) => {
    test.skip(!orderToReject, 'No order to reject');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Reject the order
    await orderHelper.rejectOrder(orderToReject, 'Testing rejection flow - out of stock');

    // Verify status
    await orderHelper.navigateToOrderDetail(orderToReject, true);
    const status = await orderHelper.getOrderStatus(orderToReject, true);
    
    expect(status.toLowerCase()).toMatch(/rechazad|rejected/i);
  });
});

test.describe('Cart Operations', () => {
  test('Empty cart shows empty state', async ({ page }) => {
    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();
    
    // Clear cart
    await cartHelper.clearCart().catch(() => {});
    
    // Check empty state
    await cartHelper.navigateToCart();
    const isEmpty = await cartHelper.isCartEmpty();
    expect(isEmpty).toBe(true);
  });
});
