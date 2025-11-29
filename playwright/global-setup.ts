import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('🚀 Starting global setup...');

  // Create directories for test artifacts if they don't exist
  const dirs = ['test-results', 'playwright-report', '.auth'];
  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // Verify test images exist
  const testImagesDir = path.join(__dirname, 'test_images');
  if (fs.existsSync(testImagesDir)) {
    const images = fs.readdirSync(testImagesDir);
    console.log(`📷 Found ${images.length} test images: ${images.join(', ')}`);
  } else {
    console.warn('⚠️ No test_images directory found');
  }

  // Log environment info
  console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`📍 API URL: ${process.env.API_URL || 'https://localhost:5001'}`);

  console.log('✅ Global setup complete');
}

export default globalSetup;
