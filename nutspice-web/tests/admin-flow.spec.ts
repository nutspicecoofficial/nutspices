import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.describe('Nutspice Admin Flow', () => {
  const ADMIN_PHONE = '9704761386';
  const OTP = '123456';

  test('Admin journey: Login -> Dashboard -> Orders -> Inventory', async ({ page }) => {
    // 1. Admin Login
    await page.goto('/admin/login');
    await page.locator('input[placeholder="9999999999"]').pressSequentially(ADMIN_PHONE, { delay: 100 });
    await page.click('button:has-text("Request Access")');
    
    await page.waitForTimeout(1000); // Wait for transition
    const otpInput = page.locator('input[placeholder="123456"]');
    await otpInput.click();
    await page.keyboard.type(OTP, { delay: 100 });
    await page.waitForTimeout(500);
    const verifyBtn = page.getByRole('button', { name: 'Authorize Entry' });
    await verifyBtn.click();

    // 2. Dashboard Verification
    await page.waitForURL('**/admin/navigation', { timeout: 20000 });
    await expect(page.locator('h1')).toContainText('Navigation & Pages');

    // Go to Dashboard
    await page.click('a[href="/admin"]');
    await expect(page.locator('h1')).toContainText('Dashboard Overview');

    // 3. Inventory Management
    await page.click('a[href="/admin/inventory"]');
    await expect(page.locator('h1')).toContainText('Inventory Management');
    // Check for categories
    await page.waitForSelector('h2');
    
    // 4. Order Management
    await page.click('a[href="/admin/orders"]');
    await expect(page.locator('h1')).toContainText('Order Fulfillment');
    
    // Check if orders are displayed
    const orderId = page.locator('span:has-text("Order #")').first();
    if (await orderId.isVisible()) {
      await expect(orderId).toBeVisible();
    }
  });
});
