import { test, expect } from '@playwright/test';
import { Page } from '@playwright/test';

// Test data and configuration
const TEST_CONFIG = {
  baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',
  apiURL: process.env.E2E_API_URL || 'http://localhost:3000',
  timeout: 30000,
};

const TEST_USERS = {
  employer: {
    email: `e2e-employer-${Date.now()}@example.com`,
    password: 'E2EEmployer123!',
    firstName: 'E2E',
    lastName: 'Employer',
    phone: '+1234567890',
    role: 'EMPLOYER',
  },
  jobSeeker: {
    email: `e2e-jobseeker-${Date.now()}@example.com`,
    password: 'E2EJobSeeker123!',
    firstName: 'E2E',
    lastName: 'JobSeeker',
    phone: '+1987654321',
    role: 'JOB_SEEKER',
  },
  customer: {
    email: `e2e-customer-${Date.now()}@example.com`,
    password: 'E2ECustomer123!',
    firstName: 'E2E',
    lastName: 'Customer',
    phone: '+1555666777',
    role: 'CUSTOMER',
  },
};

class TestHelpers {
  static async registerUser(page: Page, userData: any) {
    await page.goto(`${TEST_CONFIG.baseURL}/auth/signup`);

    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: TEST_CONFIG.timeout });

    // Fill registration form
    await page.fill('[data-testid="email-input"]', userData.email);
    await page.fill('[data-testid="password-input"]', userData.password);
    await page.fill('[data-testid="confirm-password-input"]', userData.password);
    await page.fill('[data-testid="first-name-input"]', userData.firstName);
    await page.fill('[data-testid="last-name-input"]', userData.lastName);
    await page.fill('[data-testid="phone-input"]', userData.phone);

    // Select role
    await page.click(`[data-testid="role-${userData.role.toLowerCase()}"]`);

    // Accept terms
    await page.check('[data-testid="agree-terms"]');
    await page.check('[data-testid="agree-privacy"]');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Wait for success or error
    await page.waitForSelector('[data-testid="registration-success"], [data-testid="registration-error"]', {
      timeout: TEST_CONFIG.timeout
    });

    // Check if registration was successful
    const isSuccess = await page.isVisible('[data-testid="registration-success"]');
    expect(isSuccess).toBeTruthy();
  }

  static async loginUser(page: Page, email: string, password: string, role: string) {
    await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);

    // Wait for login form
    await page.waitForSelector('form', { timeout: TEST_CONFIG.timeout });

    // Select role first
    await page.click(`[aria-label*="${role}"]`);

    // Fill login form
    await page.fill('#email-input', email);
    await page.fill('#password-input', password);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for redirect or error
    await page.waitForLoadState('networkidle');

    // Verify we're logged in (should redirect to dashboard or profile)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/login');
  }

  static async logoutUser(page: Page) {
    // Look for user menu or logout button
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Wait for redirect to login page
    await page.waitForURL('**/auth/login');
  }

  static async createJobPosting(page: Page, jobData: any) {
    await page.goto(`${TEST_CONFIG.baseURL}/jobs/create`);

    // Fill job posting form
    await page.fill('[data-testid="job-title"]', jobData.title);
    await page.fill('[data-testid="job-description"]', jobData.description);
    await page.selectOption('[data-testid="job-type"]', jobData.type);
    await page.fill('[data-testid="job-location"]', jobData.location);
    await page.fill('[data-testid="salary-min"]', jobData.salary.min.toString());
    await page.fill('[data-testid="salary-max"]', jobData.salary.max.toString());

    // Add requirements
    for (const requirement of jobData.requirements) {
      await page.fill('[data-testid="requirement-input"]', requirement);
      await page.click('[data-testid="add-requirement"]');
    }

    // Submit job posting
    await page.click('[data-testid="create-job-button"]');

    // Wait for success
    await page.waitForSelector('[data-testid="job-created-success"]', {
      timeout: TEST_CONFIG.timeout
    });

    // Return job ID from URL or response
    const jobId = page.url().split('/jobs/')[1];
    return jobId;
  }
}

test.describe('Critical User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('User Registration and Authentication Journey', () => {
    test('Complete employer registration → login → dashboard access flow', async ({ page }) => {
      // Step 1: Register new employer
      await TestHelpers.registerUser(page, TEST_USERS.employer);

      // Step 2: Login with new credentials
      await TestHelpers.loginUser(
        page,
        TEST_USERS.employer.email,
        TEST_USERS.employer.password,
        'EMPLOYER'
      );

      // Step 3: Verify access to employer dashboard
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);

      // Should see employer-specific content
      await expect(page.locator('[data-testid="employer-dashboard"]')).toBeVisible();
      await expect(page.locator('text=Job Postings')).toBeVisible();
      await expect(page.locator('text=Applications')).toBeVisible();

      // Step 4: Access profile settings
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="profile-settings"]');

      // Verify profile data is pre-filled
      await expect(page.locator('#first-name')).toHaveValue(TEST_USERS.employer.firstName);
      await expect(page.locator('#last-name')).toHaveValue(TEST_USERS.employer.lastName);
      await expect(page.locator('#email')).toHaveValue(TEST_USERS.employer.email);

      // Step 5: Logout successfully
      await TestHelpers.logoutUser(page);
      await expect(page).toHaveURL(/.*auth\/login/);
    });

    test('Complete job seeker registration → login → job search flow', async ({ page }) => {
      // Step 1: Register new job seeker
      await TestHelpers.registerUser(page, TEST_USERS.jobSeeker);

      // Step 2: Login
      await TestHelpers.loginUser(
        page,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      // Step 3: Access job search
      await page.goto(`${TEST_CONFIG.baseURL}/jobs`);

      // Should see job listings
      await expect(page.locator('[data-testid="job-listings"]')).toBeVisible();

      // Step 4: Use job search filters
      await page.fill('[data-testid="job-search-input"]', 'chef');
      await page.selectOption('[data-testid="job-type-filter"]', 'FULL_TIME');
      await page.click('[data-testid="search-jobs-button"]');

      // Wait for filtered results
      await page.waitForSelector('[data-testid="job-card"]');

      // Step 5: View job details
      await page.click('[data-testid="job-card"]:first-child');
      await expect(page.locator('[data-testid="job-details"]')).toBeVisible();

      // Should see apply button for job seekers
      await expect(page.locator('[data-testid="apply-job-button"]')).toBeVisible();
    });

    test('Password reset flow', async ({ page }) => {
      // First register a user
      await TestHelpers.registerUser(page, TEST_USERS.customer);

      // Navigate to login and click forgot password
      await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);
      await page.click('text=Forgot password?');

      // Fill forgot password form
      await page.fill('[data-testid="reset-email-input"]', TEST_USERS.customer.email);
      await page.click('[data-testid="send-reset-button"]');

      // Should show success message
      await expect(page.locator('[data-testid="reset-email-sent"]')).toBeVisible();

      // Note: In a real test, you would check email or use a test email service
      // For this test, we verify the UI flow completed successfully
    });
  });

  test.describe('Job Management Journey', () => {
    test('Complete job posting → application → hiring workflow', async ({ page, context }) => {
      // Setup: Create two users (employer and job seeker)
      const employerPage = await context.newPage();
      const jobSeekerPage = await context.newPage();

      // Register employer
      await TestHelpers.registerUser(employerPage, TEST_USERS.employer);
      await TestHelpers.loginUser(
        employerPage,
        TEST_USERS.employer.email,
        TEST_USERS.employer.password,
        'EMPLOYER'
      );

      // Register job seeker
      await TestHelpers.registerUser(jobSeekerPage, TEST_USERS.jobSeeker);
      await TestHelpers.loginUser(
        jobSeekerPage,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      // Step 1: Employer creates job posting
      const jobData = {
        title: 'Senior Chef Position',
        description: 'Looking for an experienced chef to lead our kitchen team.',
        type: 'FULL_TIME',
        location: 'New York, NY',
        salary: { min: 60000, max: 80000 },
        requirements: [
          '5+ years of culinary experience',
          'Leadership skills',
          'Food safety certification'
        ]
      };

      const jobId = await TestHelpers.createJobPosting(employerPage, jobData);
      expect(jobId).toBeTruthy();

      // Step 2: Job seeker finds and applies to job
      await jobSeekerPage.goto(`${TEST_CONFIG.baseURL}/jobs`);

      // Search for the job
      await jobSeekerPage.fill('[data-testid="job-search-input"]', 'Senior Chef');
      await jobSeekerPage.click('[data-testid="search-jobs-button"]');

      // Click on the job
      await jobSeekerPage.click(`[data-testid="job-${jobId}"]`);

      // Apply for the job
      await jobSeekerPage.click('[data-testid="apply-job-button"]');

      // Fill application form
      await jobSeekerPage.fill('[data-testid="cover-letter"]',
        'I am very interested in this position and believe my experience makes me a perfect fit.'
      );
      await jobSeekerPage.selectOption('[data-testid="availability"]', 'IMMEDIATE');
      await jobSeekerPage.fill('[data-testid="expected-salary"]', '70000');

      // Submit application
      await jobSeekerPage.click('[data-testid="submit-application"]');

      // Verify application submitted
      await expect(jobSeekerPage.locator('[data-testid="application-success"]')).toBeVisible();

      // Step 3: Employer reviews application
      await employerPage.goto(`${TEST_CONFIG.baseURL}/jobs/${jobId}/applications`);

      // Should see the application
      await expect(employerPage.locator('[data-testid="application-card"]')).toBeVisible();

      // Click to view application details
      await employerPage.click('[data-testid="view-application"]:first-child');

      // Should see applicant details
      await expect(employerPage.locator(`text=${TEST_USERS.jobSeeker.firstName}`)).toBeVisible();
      await expect(employerPage.locator(`text=${TEST_USERS.jobSeeker.lastName}`)).toBeVisible();

      // Step 4: Employer updates application status
      await employerPage.click('[data-testid="update-status-button"]');
      await employerPage.selectOption('[data-testid="status-select"]', 'UNDER_REVIEW');
      await employerPage.fill('[data-testid="status-notes"]', 'Candidate looks promising, scheduling interview.');
      await employerPage.click('[data-testid="save-status-button"]');

      // Verify status updated
      await expect(employerPage.locator('text=UNDER_REVIEW')).toBeVisible();

      // Step 5: Job seeker checks application status
      await jobSeekerPage.goto(`${TEST_CONFIG.baseURL}/applications`);

      // Should see updated status
      await expect(jobSeekerPage.locator('text=UNDER_REVIEW')).toBeVisible();
      await expect(jobSeekerPage.locator('text=Candidate looks promising')).toBeVisible();
    });

    test('Job search and filtering functionality', async ({ page }) => {
      // Setup: Login as job seeker
      await TestHelpers.registerUser(page, TEST_USERS.jobSeeker);
      await TestHelpers.loginUser(
        page,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      // Navigate to jobs page
      await page.goto(`${TEST_CONFIG.baseURL}/jobs`);

      // Test search functionality
      await page.fill('[data-testid="job-search-input"]', 'manager');
      await page.click('[data-testid="search-jobs-button"]');

      // Verify search results
      await page.waitForSelector('[data-testid="job-card"]');
      const jobCards = await page.locator('[data-testid="job-card"]').count();
      expect(jobCards).toBeGreaterThan(0);

      // Test filters
      await page.selectOption('[data-testid="job-type-filter"]', 'FULL_TIME');
      await page.selectOption('[data-testid="experience-level-filter"]', 'SENIOR');
      await page.fill('[data-testid="location-filter"]', 'New York');

      // Apply filters
      await page.click('[data-testid="apply-filters-button"]');

      // Wait for filtered results
      await page.waitForSelector('[data-testid="job-card"]');

      // Test sorting
      await page.selectOption('[data-testid="sort-by"]', 'salary-desc');
      await page.waitForLoadState('networkidle');

      // Verify results are updated
      const filteredJobCards = await page.locator('[data-testid="job-card"]').count();
      expect(filteredJobCards).toBeGreaterThan(0);

      // Test pagination if more than 10 results
      if (filteredJobCards > 10) {
        await page.click('[data-testid="next-page"]');
        await page.waitForSelector('[data-testid="job-card"]');

        // Should be on page 2
        await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
      }
    });
  });

  test.describe('Profile Management Journey', () => {
    test('Complete profile update and preferences workflow', async ({ page }) => {
      // Setup: Register and login user
      await TestHelpers.registerUser(page, TEST_USERS.jobSeeker);
      await TestHelpers.loginUser(
        page,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      // Navigate to profile settings
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="profile-settings"]');

      // Update profile information
      await page.fill('#bio', 'Experienced chef with passion for creating exceptional dining experiences.');
      await page.fill('#location', 'San Francisco, CA');
      await page.selectOption('#experience-level', 'SENIOR');

      // Add skills
      await page.fill('[data-testid="skills-input"]', 'French Cuisine');
      await page.click('[data-testid="add-skill"]');
      await page.fill('[data-testid="skills-input"]', 'Team Leadership');
      await page.click('[data-testid="add-skill"]');
      await page.fill('[data-testid="skills-input"]', 'Menu Development');
      await page.click('[data-testid="add-skill"]');

      // Save profile
      await page.click('[data-testid="save-profile"]');

      // Verify success message
      await expect(page.locator('[data-testid="profile-saved"]')).toBeVisible();

      // Navigate to job preferences
      await page.click('[data-testid="job-preferences-tab"]');

      // Set job preferences
      await page.check('[data-testid="job-type-FULL_TIME"]');
      await page.check('[data-testid="job-type-PART_TIME"]');
      await page.fill('[data-testid="preferred-locations"]', 'San Francisco, Oakland, Berkeley');
      await page.fill('[data-testid="min-salary"]', '65000');
      await page.check('[data-testid="remote-work"]');

      // Save preferences
      await page.click('[data-testid="save-preferences"]');
      await expect(page.locator('[data-testid="preferences-saved"]')).toBeVisible();

      // Test notification settings
      await page.click('[data-testid="notifications-tab"]');

      // Update notification preferences
      await page.check('[data-testid="email-job-matches"]');
      await page.check('[data-testid="email-application-updates"]');
      await page.uncheck('[data-testid="sms-notifications"]');

      // Save notification settings
      await page.click('[data-testid="save-notifications"]');
      await expect(page.locator('[data-testid="notifications-saved"]')).toBeVisible();

      // Verify all changes persist after page refresh
      await page.reload();
      await expect(page.locator('#bio')).toHaveValue(/Experienced chef/);
      await expect(page.locator('#location')).toHaveValue('San Francisco, CA');
      await expect(page.locator('[data-testid="skill-French Cuisine"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('Handle network failures gracefully', async ({ page }) => {
      // Register and login user first
      await TestHelpers.registerUser(page, TEST_USERS.jobSeeker);
      await TestHelpers.loginUser(
        page,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      // Try to load jobs page
      await page.goto(`${TEST_CONFIG.baseURL}/jobs`);

      // Should show error message
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
      await expect(page.locator('text=Unable to load jobs')).toBeVisible();

      // Should show retry button
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Remove network failure simulation
      await page.unroute('**/api/**');

      // Click retry
      await page.click('[data-testid="retry-button"]');

      // Should load successfully now
      await page.waitForSelector('[data-testid="job-listings"]');
    });

    test('Handle form validation errors', async ({ page }) => {
      await page.goto(`${TEST_CONFIG.baseURL}/auth/signup`);

      // Submit form without filling required fields
      await page.click('[data-testid="register-button"]');

      // Should show validation errors
      await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="role-error"]')).toBeVisible();

      // Fill form with invalid data
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', '123'); // Too short
      await page.fill('[data-testid="confirm-password-input"]', '456'); // Doesn't match

      await page.click('[data-testid="register-button"]');

      // Should show specific validation messages
      await expect(page.locator('text=valid email address')).toBeVisible();
      await expect(page.locator('text=at least 8 characters')).toBeVisible();
      await expect(page.locator('text=Passwords must match')).toBeVisible();
    });

    test('Handle session expiration', async ({ page }) => {
      // Login user
      await TestHelpers.registerUser(page, TEST_USERS.customer);
      await TestHelpers.loginUser(
        page,
        TEST_USERS.customer.email,
        TEST_USERS.customer.password,
        'CUSTOMER'
      );

      // Simulate expired session by clearing cookies
      await page.context().clearCookies();

      // Try to access protected route
      await page.goto(`${TEST_CONFIG.baseURL}/dashboard`);

      // Should redirect to login
      await expect(page).toHaveURL(/.*auth\/login/);

      // Should show session expired message
      await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();
    });

    test('Handle server errors gracefully', async ({ page }) => {
      // Simulate server error responses
      await page.route('**/api/auth/login', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            message: 'Internal server error'
          })
        });
      });

      await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);

      // Fill valid login form
      await page.click('[data-testid="role-customer"]');
      await page.fill('#email-input', 'test@example.com');
      await page.fill('#password-input', 'password123');
      await page.click('button[type="submit"]');

      // Should show server error message
      await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
      await expect(page.locator('text=Something went wrong')).toBeVisible();

      // Should still allow retry
      await page.unroute('**/api/auth/login');
    });
  });

  test.describe('Mobile Responsiveness Journey', () => {
    test('Complete mobile user journey', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Test mobile registration
      await page.goto(`${TEST_CONFIG.baseURL}/auth/signup`);

      // Should have mobile-friendly layout
      await expect(page.locator('[data-testid="mobile-signup-form"]')).toBeVisible();

      // Fill form on mobile
      await page.fill('[data-testid="email-input"]', TEST_USERS.jobSeeker.email);
      await page.fill('[data-testid="password-input"]', TEST_USERS.jobSeeker.password);
      await page.fill('[data-testid="confirm-password-input"]', TEST_USERS.jobSeeker.password);
      await page.fill('[data-testid="first-name-input"]', TEST_USERS.jobSeeker.firstName);
      await page.fill('[data-testid="last-name-input"]', TEST_USERS.jobSeeker.lastName);
      await page.fill('[data-testid="phone-input"]', TEST_USERS.jobSeeker.phone);

      // Select role on mobile
      await page.click('[data-testid="role-JOB_SEEKER"]');

      // Accept terms
      await page.check('[data-testid="agree-terms"]');
      await page.check('[data-testid="agree-privacy"]');

      // Submit registration
      await page.click('[data-testid="register-button"]');

      // Should succeed on mobile
      await expect(page.locator('[data-testid="registration-success"]')).toBeVisible();

      // Test mobile login
      await TestHelpers.loginUser(
        page,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      // Test mobile job search
      await page.goto(`${TEST_CONFIG.baseURL}/jobs`);

      // Should have mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

      // Test mobile job filters
      await page.click('[data-testid="mobile-filters-button"]');
      await expect(page.locator('[data-testid="mobile-filters-modal"]')).toBeVisible();

      // Close filters
      await page.click('[data-testid="close-filters"]');

      // Test mobile job card interaction
      await page.click('[data-testid="job-card"]:first-child');
      await expect(page.locator('[data-testid="mobile-job-details"]')).toBeVisible();
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('Page load performance benchmarks', async ({ page }) => {
      // Enable performance metrics
      await page.addInitScript(() => {
        window.performance.mark('test-start');
      });

      // Test login page load time
      const loginStart = Date.now();
      await page.goto(`${TEST_CONFIG.baseURL}/auth/login`);
      await page.waitForLoadState('networkidle');
      const loginLoadTime = Date.now() - loginStart;

      console.log(`Login page load time: ${loginLoadTime}ms`);
      expect(loginLoadTime).toBeLessThan(3000); // Should load within 3 seconds

      // Test jobs page load time
      await TestHelpers.registerUser(page, TEST_USERS.jobSeeker);
      await TestHelpers.loginUser(
        page,
        TEST_USERS.jobSeeker.email,
        TEST_USERS.jobSeeker.password,
        'JOB_SEEKER'
      );

      const jobsStart = Date.now();
      await page.goto(`${TEST_CONFIG.baseURL}/jobs`);
      await page.waitForSelector('[data-testid="job-listings"]');
      const jobsLoadTime = Date.now() - jobsStart;

      console.log(`Jobs page load time: ${jobsLoadTime}ms`);
      expect(jobsLoadTime).toBeLessThan(5000); // Should load within 5 seconds

      // Test search performance
      const searchStart = Date.now();
      await page.fill('[data-testid="job-search-input"]', 'chef');
      await page.click('[data-testid="search-jobs-button"]');
      await page.waitForSelector('[data-testid="job-card"]');
      const searchTime = Date.now() - searchStart;

      console.log(`Search response time: ${searchTime}ms`);
      expect(searchTime).toBeLessThan(2000); // Search should complete within 2 seconds
    });
  });
});