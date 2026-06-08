import { test, expect } from '@playwright/test';

test('Verify Google Shopping UI in Product Manager', async ({ page }) => {
  // 1. Go to Login page
  console.log("Navigating to login page...");
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });

  // 2. Fill credentials and sign in
  console.log("Logging in...");
  await page.fill('input[type="email"]', 'emmercy65@gmail.com');
  await page.fill('input[type="password"]', 'Savannah2026!Master');
  await page.click('button:has-text("Sign In")');

  // 3. Wait for dashboard page to load
  console.log("Waiting for dashboard redirect...");
  await page.waitForURL('**/a', { timeout: 20000 });
  await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 15000 });

  // 4. Navigate to Products
  console.log("Navigating to Product Manager...");
  await page.goto('/a/products');
  await page.waitForSelector('button:has-text("Add Product")', { timeout: 15000 });

  // 5. Click "Add Product" to open the form
  console.log("Opening Add Product modal...");
  await page.click('button:has-text("Add Product")');
  await page.waitForSelector('text=Google Shopping Attributes', { timeout: 15000 });

  // 6. Scroll to Google Shopping panel and click it
  console.log("Expanding Google Shopping section...");
  const googlePanelHeader = page.locator('text=Google Shopping Attributes');
  await googlePanelHeader.scrollIntoViewIfNeeded();
  await googlePanelHeader.click();

  // 7. Verify elements inside Google panel are visible
  console.log("Verifying fields...");
  const categorySelectorLabel = page.locator('text=Google Product Category');
  await expect(categorySelectorLabel).toBeVisible({ timeout: 5000 });

  const shippingWeightInput = page.locator('label:has-text("Shipping Weight")');
  await expect(shippingWeightInput).toBeVisible({ timeout: 5000 });

  // 8. Take screenshot
  console.log("Taking screenshot...");
  await page.screenshot({ path: 'C:/Users/LIZBETH/.gemini/antigravity-ide/brain/4c2f6214-5032-4432-8766-57444a5b9a3b/google_attributes_debug.png', fullPage: true });
  console.log("Screenshot saved!");
});
