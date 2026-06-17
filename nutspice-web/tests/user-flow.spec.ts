import { test, expect } from '@playwright/test';

test.setTimeout(60000); // Increase timeout for slower dev server

test.describe('Nutspice User Flow', () => {
  const TEST_PHONE = '8888888888';
  const OTP = '123456';

  test('Complete shopping journey: Login -> Shop -> Checkout', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/Nutspice/);

    // 2. Login
    await page.click('button:has-text("Login"), a:has-text("Login")');
    await page.locator('input[placeholder="9999999999"]').pressSequentially(TEST_PHONE, { delay: 100 });
    await page.click('button:has-text("Continue")');
    
    // Fill OTP
    await page.waitForSelector('input[maxLength="6"], input[type="text"]');
    const otpInput = page.locator('input[maxLength="6"], input[type="text"]').last();
    await otpInput.click();
    await otpInput.pressSequentially(OTP, { delay: 100 });
    await page.getByRole('button', { name: 'Verify' }).click();

    // 3. Browse and Add to Cart
    await page.goto('/'); // Ensure we are on home
    // Wait for products to load
    await page.waitForSelector('h3');
    const firstProduct = page.locator('h3').first();
    const productName = await firstProduct.innerText();
    await firstProduct.click();

    // Select size and add to cart
    await page.waitForSelector('button:has-text("Add to Bag")');
    // Click a size if available
    const sizeButton = page.locator('button:has-text("M"), button:has-text("S"), button:has-text("L")').first();
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
    }
    await page.click('button:has-text("Add to Bag")');
    
    // 4. Go to Cart
    await page.click('a[href="/cart"]');
    await expect(page.locator('h1')).toContainText('Shopping Cart');
    await expect(page.locator('body')).toContainText(productName);

    // 5. Checkout Flow
    await page.click('button:has-text("Proceed to Checkout")');
    
    // Agreement Popup
    const agreeBtn = page.getByRole('button', { name: 'I Agree & Proceed' });
    await expect(agreeBtn).toBeVisible({ timeout: 10000 });
    await agreeBtn.click();

    // Address Selection
    await page.waitForSelector('h3:has-text("Delivery Address")');
    // If no address, add one
    const addNewBtn = page.locator('button:has-text("Add New Address")');
    if (await addNewBtn.isVisible()) {
      await addNewBtn.click();
      await page.fill('input[placeholder="John Doe"]', 'Test User');
      await page.fill('input[placeholder*="Boutique Lane"]', '123 Test Street');
      await page.fill('input[placeholder="Mumbai"]', 'Hyderabad');
      await page.fill('input[placeholder="Maharashtra"]', 'Telangana');
      await page.fill('input[placeholder="6 Digits"]', '500001');
      await page.fill('input[placeholder="10 Digits"]', TEST_PHONE);
    }
    await page.click('button:has-text("Proceed to Payment")');

    // Payment Step
    await expect(page.getByRole('heading', { name: 'Secure Checkout' })).toBeVisible();
    await page.click('button:has-text("Pay Now")');

    // 6. Success Verification
    // Success redirect to orders
    await page.waitForURL('**/profile/orders');
    await expect(page.locator('h1')).toContainText('My Orders');
    await expect(page.locator('body')).toContainText('#AS-');
  });
});
