import { test, expect } from '../fixtures/base';

test.describe('Navigation and Routing', () => {
  test('should navigate through main sections', async ({ authenticatedPage }) => {
    // Start on dashboard
    await expect(authenticatedPage).toHaveURL(/.*\/dashboard/);

    // Navigate to jobs section
    await authenticatedPage.click('[data-testid="nav-jobs"]');
    await expect(authenticatedPage).toHaveURL(/.*\/jobs/);
    await expect(authenticatedPage.locator('h1')).toContainText(/jobs/i);

    // Navigate to restaurant management
    await authenticatedPage.click('[data-testid="nav-restaurant"]');
    await expect(authenticatedPage).toHaveURL(/.*\/restaurant/);

    // Navigate to marketplace
    await authenticatedPage.click('[data-testid="nav-marketplace"]');
    await expect(authenticatedPage).toHaveURL(/.*\/marketplace/);

    // Navigate to community
    await authenticatedPage.click('[data-testid="nav-community"]');
    await expect(authenticatedPage).toHaveURL(/.*\/community/);
  });

  test('should handle browser back/forward navigation', async ({ authenticatedPage }) => {
    // Navigate to different pages
    await authenticatedPage.click('[data-testid="nav-jobs"]');
    await authenticatedPage.click('[data-testid="nav-marketplace"]');

    // Use browser back button
    await authenticatedPage.goBack();
    await expect(authenticatedPage).toHaveURL(/.*\/jobs/);

    // Use browser forward button
    await authenticatedPage.goForward();
    await expect(authenticatedPage).toHaveURL(/.*\/marketplace/);
  });

  test('should show loading states during navigation', async ({ authenticatedPage }) => {
    // Click navigation item
    await authenticatedPage.click('[data-testid="nav-jobs"]');

    // Should show loading indicator
    await expect(authenticatedPage.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Loading indicator should disappear
    await expect(authenticatedPage.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
  });

  test('mobile navigation should work correctly', async ({ page, testUser }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should show mobile menu button
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Click mobile menu button
    await page.click('[data-testid="mobile-menu-button"]');

    // Mobile navigation should be visible
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

    // Test navigation items
    await page.click('[data-testid="mobile-nav-jobs"]');
    await expect(page).toHaveURL(/.*\/jobs/);

    // Mobile menu should close after navigation
    await expect(page.locator('[data-testid="mobile-navigation"]')).not.toBeVisible();
  });

  test('should handle deep linking correctly', async ({ page, testUser }) => {
    // Direct navigation to deep link
    await page.goto('/restaurant/profile/edit');

    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*\/auth\/login/);

    // Login
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');

    // Should redirect back to original deep link
    await expect(page).toHaveURL(/.*\/restaurant\/profile\/edit/);
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');

    await expect(page.locator('[data-testid="404-page"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText(/not found/i);

    // Should have link back to home
    await page.click('[data-testid="back-to-home"]');
    await expect(page).toHaveURL(/.*\//);
  });

  test('breadcrumb navigation should work', async ({ authenticatedPage }) => {
    // Navigate to nested page
    await authenticatedPage.goto('/restaurant/profile/edit');

    // Check breadcrumb exists
    await expect(authenticatedPage.locator('[data-testid="breadcrumb"]')).toBeVisible();

    // Click breadcrumb item
    await authenticatedPage.click('[data-testid="breadcrumb-restaurant"]');
    await expect(authenticatedPage).toHaveURL(/.*\/restaurant/);
  });
});