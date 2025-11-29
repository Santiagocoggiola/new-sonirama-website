import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */
async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('🧹 Starting global teardown...');
  
  // Add any cleanup logic here
  // For example: clean up test data from database via API
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
