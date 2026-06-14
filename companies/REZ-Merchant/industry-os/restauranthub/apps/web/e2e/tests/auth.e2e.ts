import { test, expect } from '../fixtures/base';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test on the homepage
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login button/link
    await page.click('[data-testid="login-link"]');

    // Should be on login page
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid/i);
  });

  test('should login successfully with valid credentials', async ({ page, testUser }) => {
    await page.goto('/auth/login');

    // Fill with valid credentials
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');

    // Click register link
    await page.click('[data-testid="register-link"]');

    // Should be on register page
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.locator('h1')).toContainText('Sign Up');
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'New Test User');
    await page.fill('[data-testid="email-input"]', `test-${Date.now()}@example.com`);
    await page.fill('[data-testid="password-input"]', 'TestPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!');

    // Accept terms
    await page.check('[data-testid="terms-checkbox"]');

    // Submit form
    await page.click('[data-testid="register-button"]');

    // Should redirect to dashboard or verification page
    await expect(page).toHaveURL(/.*\/(dashboard|auth\/verify)/);
  });

  test('should logout successfully', async ({ authenticatedPage }) => {
    // Click user menu
    await authenticatedPage.click('[data-testid="user-menu"]');

    // Click logout
    await authenticatedPage.click('[data-testid="logout-button"]');

    // Should redirect to login page
    await expect(authenticatedPage).toHaveURL(/.*\/auth\/login/);

    // User menu should not be visible
    await expect(authenticatedPage.locator('[data-testid="user-menu"]')).not.toBeVisible();
  });

  test('should show forgot password form', async ({ page }) => {
    await page.goto('/auth/login');

    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');

    // Should show forgot password form
    await expect(page.locator('[data-testid="forgot-password-form"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/forgot.*password/i);
  });

  test('should handle password reset request', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    // Fill email
    await page.fill('[data-testid="email-input"]', 'test@example.com');

    // Submit form
    await page.click('[data-testid="reset-password-button"]');

    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(/reset link sent/i);
  });
});