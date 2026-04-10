import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    // Wait for the form to appear (indicating hydration)
    await page.waitForSelector('form', { timeout: 15000 });
    // Take a screenshot to see what's happening
    await page.screenshot({ path: 'test-results/login-debug.png' });
    // We check for the header text since the document title is generic
    await expect(page.locator('h1')).toHaveText(/Shop Login/i);
    await expect(page.locator('button', { hasText: /Sign In/i })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button:has-text("Sign In")');
    
    // Adjust selector based on actual error reporting UI in Login.jsx
    await expect(page.locator('.text-red-600')).toBeVisible();
  });
});
