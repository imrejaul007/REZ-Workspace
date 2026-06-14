import { test as base, expect } from '@playwright/test';

// Define types for our fixtures
type TestFixtures = {
  // Add custom fixtures here
  authenticatedPage;
  testUser: {
    email: string;
    password: string;
    name: string;
  };
};

// Extend the base test with our fixtures
export const test = base.extend<TestFixtures>({
  // Test user fixture
  testUser: async ({}, use) => {
    const testUser = {
      email: 'test@restaurant.com',
      password: 'TestPassword123!',
      name: 'Test User',
    };
    await use(testUser);
  },

  // Authenticated page fixture
  authenticatedPage: async ({ page, testUser }, use) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);

    // Submit form
    await page.click('[data-testid="login-button"]');

    // Wait for successful login (adjust selector based on your app)
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';