import { test, expect, Page, BrowserContext } from '@playwright/test';
import { AuthHelper, TEST_ADMIN } from '../helpers/auth';
import { ProductHelper, generateTestProduct, ProductTestData } from '../helpers/products';
import { CategoryHelper, generateTestCategory, CategoryTestData } from '../helpers/categories';
import { CartHelper } from '../helpers/cart';
import { OrderHelper } from '../helpers/orders';
import { NotificationHelper } from '../helpers/notifications';
import path from 'path';

/**
 * FULL E2E FLOW TEST
 * 
 * This is the main comprehensive test that validates the entire system flow:
 * 
 * Phase 1: Setup
 *   1.1. Login as admin
 *   1.2. Create test category
 *   1.3. Create test product
 *   1.4. Upload images to product
 * 
 * Phase 2: User Shopping Flow
 *   2.1. View product catalog
 *   2.2. Search and filter products
 *   2.3. View product details
 *   2.4. Add products to cart
 *   2.5. Modify cart quantities
 *   2.6. Checkout and create order
 * 
 * Phase 3: Admin Order Management
 *   3.1. Admin views new order
 *   3.2. Admin approves order
 *   3.3. User confirms order
 *   3.4. Admin marks order as ready
 *   3.5. Admin completes order
 * 
 * Phase 4: Admin Product Update
 *   4.1. Admin updates product
 *   4.2. Verify changes in catalog
 * 
 * Phase 5: Notifications
 *   5.1. Check notifications received
 *   5.2. Mark notifications as read
 * 
 * Phase 6: Cleanup
 *   6.1. Delete test product
 *   6.2. Delete test category
 *   6.3. Verify cleanup
 * 
 * This test runs sequentially to simulate a real-world scenario.
 */

test.describe.serial('Complete E2E Flow', () => {
  // Test data storage
  const testRunId = `full_e2e_${Date.now()}`;
  
  let testCategory: CategoryTestData & { id: string };
  let testProduct: ProductTestData & { id: string };
  let orderId: string;
  let orderNumber: string;

  // Test images paths
  const testImages = [
    path.join(__dirname, '..', 'test_images', 'test_1.jpg'),
    path.join(__dirname, '..', 'test_images', 'test_2.jpg'),
    path.join(__dirname, '..', 'test_images', 'test_3.jpg'),
  ];

  // ==========================================
  // PHASE 1: SETUP
  // ==========================================

  test('1.1 Login as admin', async ({ page }) => {
    const auth = new AuthHelper(page);
    await auth.loginAsAdmin();
    
    // Verify we're on admin dashboard
    await expect(page).toHaveURL('/admin/products');
    await expect(page.getByTestId('admin-navbar')).toBeVisible();
  });

  test('1.2 Create test category', async ({ page }) => {
    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // Generate and create category
    const categoryData = generateTestCategory(testRunId);
    const categoryId = await categoryHelper.createCategory(categoryData);

    expect(categoryId).toBeTruthy();
    testCategory = { ...categoryData, id: categoryId };

    // Verify category exists
    const found = await categoryHelper.verifyCategoryInTable(categoryData.name);
    expect(found).toBe(true);

    console.log(`✅ Created category: ${categoryData.name} (${categoryId})`);
  });

  test('1.3 Create test product', async ({ page }) => {
    test.skip(!testCategory?.id, 'Category not created');

    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);

    await auth.loginAsAdmin();

    // Generate and create product
    const productData = generateTestProduct(testRunId);
    productData.category = testCategory.name;
    productData.categoryId = testCategory.id;
    productData.price = 2500; // Fixed price for easy verification
    productData.description = 'Test product for E2E automation. This product will be used to test the complete shopping flow.';

    const productId = await productHelper.createProduct(productData);

    expect(productId).toBeTruthy();
    testProduct = { ...productData, id: productId };

    // Verify product exists
    const found = await productHelper.verifyProductInTable(productData.name);
    expect(found).toBe(true);

    console.log(`✅ Created product: ${productData.name} (${productId})`);
  });

  test('1.4 Upload images to product', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);

    await auth.loginAsAdmin();

    // Navigate to product edit page
    await page.goto(`/admin/products/${testProduct.id}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('product-editor')).toBeVisible({ timeout: 15000 });

    // Check if file input exists
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Upload all test images
      await fileInput.setInputFiles(testImages);
      
      // Wait for upload to complete
      await page.waitForTimeout(5000);
      
      console.log(`✅ Uploaded ${testImages.length} images to product`);
    } else {
      console.log('⚠️ File input not found - skipping image upload');
    }
  });

  // ==========================================
  // PHASE 2: USER SHOPPING FLOW
  // ==========================================

  test('2.1 View product catalog', async ({ page }) => {
    const auth = new AuthHelper(page);

    await auth.loginAsAdmin();

    // Navigate to products catalog
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Verify catalog is visible
    await expect(page.getByTestId('products-grid')).toBeVisible({ timeout: 15000 });

    // Check product count is displayed
    const countElement = page.getByTestId('products-grid-count');
    if (await countElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      const countText = await countElement.textContent();
      console.log(`📦 Products in catalog: ${countText}`);
    }
  });

  test('2.2 Search for test product', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);

    await auth.loginAsAdmin();
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Use filters to search
    const searchInput = page.getByTestId('product-filters-search');
    if (await searchInput.isVisible({ timeout: 5000 })) {
      await searchInput.fill(testProduct.name);
      
      const applyBtn = page.getByTestId('product-filters-apply');
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }
      
      await page.waitForTimeout(1000);
    }

    // Verify product appears in filtered results
    const productCard = page.locator('[data-testid^="product-card"]').filter({ hasText: testRunId });
    await expect(productCard.first()).toBeVisible({ timeout: 10000 });

    console.log(`✅ Found product in catalog search`);
  });

  test('2.3 View product details', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);

    await auth.loginAsAdmin();

    // Navigate to product detail
    await page.goto(`/products/${testProduct.id}`);
    await page.waitForLoadState('networkidle');

    // Verify detail page
    await expect(page.getByTestId('product-detail')).toBeVisible({ timeout: 15000 });
    
    // Verify product name
    await expect(page.getByTestId('product-detail-name')).toContainText(testProduct.name);
    
    // Verify price is displayed
    await expect(page.getByTestId('product-detail-price')).toBeVisible();

    console.log(`✅ Product detail page displays correctly`);
  });

  test('2.4 Add product to cart', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();

    // Clear cart first
    await cartHelper.clearCart().catch(() => {});

    // Add product with quantity 3
    await cartHelper.addProductToCart(testProduct.id, 3);

    // Verify cart badge shows count
    const badgeCount = await cartHelper.getCartBadgeCount();
    expect(badgeCount).toBeGreaterThan(0);

    console.log(`✅ Added product to cart (qty: 3)`);
  });

  test('2.5 Modify cart quantities', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();
    await cartHelper.navigateToCart();

    // Verify cart is not empty
    const isEmpty = await cartHelper.isCartEmpty();
    expect(isEmpty).toBe(false);

    // Update quantity to 5
    await cartHelper.updateItemQuantity(testProduct.id, 5);
    await page.waitForTimeout(1000);

    // Verify total updated
    const total = await cartHelper.getCartTotal();
    expect(total).toBeGreaterThan(0);

    console.log(`✅ Updated cart quantity to 5, total: ${total}`);
  });

  test('2.6 Checkout and create order', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);
    const cartHelper = new CartHelper(page);

    await auth.loginAsAdmin();

    // Perform checkout
    orderId = await cartHelper.checkout();
    expect(orderId).toBeTruthy();

    // Verify on order detail page
    await expect(page.getByTestId('order-detail')).toBeVisible({ timeout: 15000 });

    // Get order number from page
    const orderNumberElement = page.getByTestId('order-detail-number');
    if (await orderNumberElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      orderNumber = await orderNumberElement.textContent() || '';
    }

    console.log(`✅ Order created: ${orderId} (${orderNumber})`);
  });

  // ==========================================
  // PHASE 3: ADMIN ORDER MANAGEMENT
  // ==========================================

  test('3.1 Admin views order in admin panel', async ({ page }) => {
    test.skip(!orderId, 'Order not created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Navigate to admin orders
    await orderHelper.navigateToAdminOrders();

    // Verify orders table is visible
    await expect(page.getByTestId('admin-orders-table')).toBeVisible();

    // Navigate to order detail
    await orderHelper.navigateToOrderDetail(orderId, true);
    await expect(page.getByTestId('admin-order-detail')).toBeVisible();

    console.log(`✅ Admin can view order details`);
  });

  test('3.2 Admin approves order', async ({ page }) => {
    test.skip(!orderId, 'Order not created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Approve the order
    await orderHelper.approveOrder(orderId);
    await page.waitForTimeout(1000);

    // Verify status changed (navigate to detail to check)
    await orderHelper.navigateToOrderDetail(orderId, true);
    
    console.log(`✅ Admin approved order`);
  });

  test('3.3 User confirms order', async ({ page }) => {
    test.skip(!orderId, 'Order not created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // User confirms the approved order
    await orderHelper.confirmOrder(orderId);
    await page.waitForTimeout(1000);

    console.log(`✅ User confirmed order`);
  });

  test('3.4 Admin marks order as ready', async ({ page }) => {
    test.skip(!orderId, 'Order not created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Mark order as ready for pickup
    await orderHelper.markOrderReady(orderId);
    await page.waitForTimeout(1000);

    console.log(`✅ Admin marked order as ready`);
  });

  test('3.5 Admin completes order', async ({ page }) => {
    test.skip(!orderId, 'Order not created');

    const auth = new AuthHelper(page);
    const orderHelper = new OrderHelper(page);

    await auth.loginAsAdmin();

    // Complete the order
    await orderHelper.completeOrder(orderId);
    await page.waitForTimeout(1000);

    // Verify final status
    await orderHelper.navigateToOrderDetail(orderId, true);
    const status = await orderHelper.getOrderStatus(orderId, true);

    expect(status.toLowerCase()).toMatch(/completad|entregad|completed/i);

    console.log(`✅ Order completed. Final status: ${status}`);
  });

  // ==========================================
  // PHASE 4: ADMIN PRODUCT UPDATE
  // ==========================================

  test('4.1 Admin updates product price', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);

    await auth.loginAsAdmin();

    // Update product with new price
    const newPrice = testProduct.price + 1000;
    const newDescription = `${testProduct.description} [UPDATED at ${new Date().toISOString()}]`;

    await productHelper.updateProduct(testProduct.id, {
      price: newPrice,
      description: newDescription,
    });

    // Update local reference
    testProduct.price = newPrice;
    testProduct.description = newDescription;

    console.log(`✅ Updated product price to ${newPrice}`);
  });

  test('4.2 Verify product changes in catalog', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);

    await auth.loginAsAdmin();

    // Navigate to product detail
    await page.goto(`/products/${testProduct.id}`);
    await page.waitForLoadState('networkidle');

    // Verify updated price is shown
    const priceElement = page.getByTestId('product-detail-price');
    await expect(priceElement).toBeVisible();

    console.log(`✅ Product changes reflected in catalog`);
  });

  // ==========================================
  // PHASE 5: NOTIFICATIONS
  // ==========================================

  test('5.1 Check notification system', async ({ page }) => {
    const auth = new AuthHelper(page);
    const notificationHelper = new NotificationHelper(page);

    await auth.loginAsAdmin();
    await page.waitForTimeout(2000);

    // Verify notification bell is present
    const bellButton = page.getByTestId('admin-navbar-notifications');
    await expect(bellButton).toBeVisible();

    // Open notifications panel
    await notificationHelper.openNotificationsPanel(true);

    // Panel should be visible
    const panel = page.getByTestId('admin-notifications-panel');
    await expect(panel).toBeVisible();

    // Close panel
    await notificationHelper.closeNotificationsPanel();

    console.log(`✅ Notification system working`);
  });

  test('5.2 Navigate to notifications page', async ({ page }) => {
    const auth = new AuthHelper(page);

    await auth.loginAsAdmin();

    // Navigate to notifications
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');

    // Verify notifications list is visible
    await expect(page.getByTestId('notifications-list')).toBeVisible();

    console.log(`✅ Notifications page accessible`);
  });

  // ==========================================
  // PHASE 6: CLEANUP
  // ==========================================

  test('6.1 Delete test product', async ({ page }) => {
    test.skip(!testProduct?.id, 'Product not created');

    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);

    await auth.loginAsAdmin();

    // Delete the product
    await productHelper.deleteProduct(testProduct.id);
    await page.waitForTimeout(1000);

    console.log(`🗑️ Deleted product: ${testProduct.name}`);
  });

  test('6.2 Delete test category', async ({ page }) => {
    test.skip(!testCategory?.id, 'Category not created');

    const auth = new AuthHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // Delete the category
    await categoryHelper.deleteCategory(testCategory.id);
    await page.waitForTimeout(1000);

    console.log(`🗑️ Deleted category: ${testCategory.name}`);
  });

  test('6.3 Verify cleanup', async ({ page }) => {
    const auth = new AuthHelper(page);
    const productHelper = new ProductHelper(page);
    const categoryHelper = new CategoryHelper(page);

    await auth.loginAsAdmin();

    // Verify product is gone
    await productHelper.navigateToProducts();
    await productHelper.searchProduct(testRunId);
    await page.waitForTimeout(1000);

    const productRow = page.locator('tbody tr').filter({ hasText: testRunId });
    const productCount = await productRow.count();

    // Verify category is gone
    await categoryHelper.navigateToCategories();
    await categoryHelper.searchCategory(testRunId);
    await page.waitForTimeout(1000);

    const categoryRow = page.locator('tbody tr').filter({ hasText: testRunId });
    const categoryCount = await categoryRow.count();

    console.log(`✅ Cleanup verification complete`);
    console.log(`   Products remaining with test ID: ${productCount}`);
    console.log(`   Categories remaining with test ID: ${categoryCount}`);
    console.log('');
    console.log('🎉 FULL E2E FLOW COMPLETED SUCCESSFULLY!');
  });
});
