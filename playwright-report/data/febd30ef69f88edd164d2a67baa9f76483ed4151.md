# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Authentication Flow >> should show login page
- Location: e2e\auth.spec.js:4:3

# Error details

```
TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
Call log:
  - waiting for locator('form') to be visible

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should show login page', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     // Wait for the form to appear (indicating hydration)
> 7  |     await page.waitForSelector('form', { timeout: 15000 });
     |                ^ TimeoutError: page.waitForSelector: Timeout 15000ms exceeded.
  8  |     // Take a screenshot to see what's happening
  9  |     await page.screenshot({ path: 'test-results/login-debug.png' });
  10 |     // We check for the header text since the document title is generic
  11 |     await expect(page.locator('h1')).toHaveText(/Shop Login/i);
  12 |     await expect(page.locator('button', { hasText: /Sign In/i })).toBeVisible();
  13 |   });
  14 | 
  15 |   test('should show error on invalid credentials', async ({ page }) => {
  16 |     await page.goto('/login');
  17 |     await page.fill('input[type="email"]', 'wrong@example.com');
  18 |     await page.fill('input[type="password"]', 'wrongpassword');
  19 |     await page.click('button:has-text("Sign In")');
  20 |     
  21 |     // Adjust selector based on actual error reporting UI in Login.jsx
  22 |     await expect(page.locator('.text-red-600')).toBeVisible();
  23 |   });
  24 | });
  25 | 
```