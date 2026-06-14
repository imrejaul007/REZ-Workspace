import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestFactories } from './test-factories';
import { AuthTestHelpers } from './auth-test-helpers';

/**
 * API testing helpers for making HTTP requests
 */
export class ApiTestHelpers {
  private app: INestApplication;

  constructor(app: INestApplication) {
    this.app = app;
  }

  /**
   * Make authenticated GET request
   */
  async authenticatedGet(url: string, token: string, query?) {
    const req = request(this.app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${token}`);

    if (query) {
      req.query(query);
    }

    return req;
  }

  /**
   * Make authenticated POST request
   */
  async authenticatedPost(url: string, token: string, data) {
    return request(this.app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${token}`)
      .send(data);
  }

  /**
   * Make authenticated PUT request
   */
  async authenticatedPut(url: string, token: string, data) {
    return request(this.app.getHttpServer())
      .put(url)
      .set('Authorization', `Bearer ${token}`)
      .send(data);
  }

  /**
   * Make authenticated PATCH request
   */
  async authenticatedPatch(url: string, token: string, data) {
    return request(this.app.getHttpServer())
      .patch(url)
      .set('Authorization', `Bearer ${token}`)
      .send(data);
  }

  /**
   * Make authenticated DELETE request
   */
  async authenticatedDelete(url: string, token: string) {
    return request(this.app.getHttpServer())
      .delete(url)
      .set('Authorization', `Bearer ${token}`);
  }

  /**
   * Make unauthenticated GET request
   */
  async get(url: string, query?) {
    const req = request(this.app.getHttpServer()).get(url);

    if (query) {
      req.query(query);
    }

    return req;
  }

  /**
   * Make unauthenticated POST request
   */
  async post(url: string, data) {
    return request(this.app.getHttpServer())
      .post(url)
      .send(data);
  }

  /**
   * Make unauthenticated PUT request
   */
  async put(url: string, data) {
    return request(this.app.getHttpServer())
      .put(url)
      .send(data);
  }

  /**
   * Make unauthenticated PATCH request
   */
  async patch(url: string, data) {
    return request(this.app.getHttpServer())
      .patch(url)
      .send(data);
  }

  /**
   * Make unauthenticated DELETE request
   */
  async delete(url: string) {
    return request(this.app.getHttpServer()).delete(url);
  }

  /**
   * Test login endpoint
   */
  async testLogin(credentials) {
    return this.post('/auth/login', credentials);
  }

  /**
   * Test registration endpoint
   */
  async testRegister(registrationData) {
    return this.post('/auth/register', registrationData);
  }

  /**
   * Test logout endpoint
   */
  async testLogout(token: string) {
    return this.authenticatedPost('/auth/logout', token, {});
  }

  /**
   * Test refresh token endpoint
   */
  async testRefreshToken(refreshToken: string) {
    return this.post('/auth/refresh', { refreshToken });
  }

  /**
   * Test password reset request
   */
  async testPasswordResetRequest(email: string) {
    return this.post('/auth/password-reset/request', { email });
  }

  /**
   * Test password reset
   */
  async testPasswordReset(token: string, newPassword: string) {
    return this.post('/auth/password-reset/confirm', {
      token,
      password: newPassword,
      confirmPassword: newPassword,
    });
  }

  /**
   * Test email verification
   */
  async testEmailVerification(token: string) {
    return this.post('/auth/verify-email', { token });
  }

  /**
   * Test user profile retrieval
   */
  async testGetProfile(token: string) {
    return this.authenticatedGet('/users/profile', token);
  }

  /**
   * Test user profile update
   */
  async testUpdateProfile(token: string, profileData) {
    return this.authenticatedPut('/users/profile', token, profileData);
  }

  /**
   * Test user list retrieval (admin)
   */
  async testGetUsers(token: string, query?) {
    return this.authenticatedGet('/users', token, query);
  }

  /**
   * Test user creation (admin)
   */
  async testCreateUser(token: string, userData) {
    return this.authenticatedPost('/users', token, userData);
  }

  /**
   * Test restaurant creation
   */
  async testCreateRestaurant(token: string, restaurantData) {
    return this.authenticatedPost('/restaurants', token, restaurantData);
  }

  /**
   * Test restaurant list retrieval
   */
  async testGetRestaurants(query?) {
    return this.get('/restaurants', query);
  }

  /**
   * Test job posting creation
   */
  async testCreateJob(token: string, jobData) {
    return this.authenticatedPost('/jobs', token, jobData);
  }

  /**
   * Test job list retrieval
   */
  async testGetJobs(query?) {
    return this.get('/jobs', query);
  }

  /**
   * Test health check endpoint
   */
  async testHealthCheck() {
    return this.get('/health');
  }

  /**
   * Test rate limiting
   */
  async testRateLimit(endpoint: string, method: string = 'GET', attempts: number = 20) {
    const requests = [];

    for (let i = 0; i < attempts; i++) {
      if (method === 'GET') {
        requests.push(this.get(endpoint));
      } else if (method === 'POST') {
        requests.push(this.post(endpoint, {}));
      }
    }

    return Promise.all(requests);
  }

  /**
   * Test CORS headers
   */
  async testCorsHeaders(url: string) {
    return request(this.app.getHttpServer())
      .options(url)
      .set('Origin', 'https://example.com')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization');
  }

  /**
   * Test input validation
   */
  async testInputValidation(url: string, method: string, invalidData, token?: string) {
    let req;

    if (method === 'POST') {
      req = token ?
        this.authenticatedPost(url, token, invalidData) :
        this.post(url, invalidData);
    } else if (method === 'PUT') {
      req = token ?
        this.authenticatedPut(url, token, invalidData) :
        this.put(url, invalidData);
    } else if (method === 'PATCH') {
      req = token ?
        this.authenticatedPatch(url, token, invalidData) :
        this.patch(url, invalidData);
    }

    return req;
  }

  /**
   * Test pagination
   */
  async testPagination(url: string, token?: string) {
    const tests = [
      { page: 1, limit: 10 },
      { page: 2, limit: 5 },
      { page: 1, limit: 100 }, // Test max limit
      { page: -1, limit: 10 }, // Test invalid page
      { page: 1, limit: -5 }, // Test invalid limit
    ];

    const results = [];
    for (const query of tests) {
      const result = token ?
        await this.authenticatedGet(url, token, query) :
        await this.get(url, query);
      results.push({ query, result });
    }

    return results;
  }

  /**
   * Test search functionality
   */
  async testSearch(url: string, searchTerms: string[], token?: string) {
    const results = [];

    for (const term of searchTerms) {
      const query = { search: term };
      const result = token ?
        await this.authenticatedGet(url, token, query) :
        await this.get(url, query);
      results.push({ term, result });
    }

    return results;
  }

  /**
   * Test sorting functionality
   */
  async testSorting(url: string, sortOptions: unknown[], token?: string) {
    const results = [];

    for (const sort of sortOptions) {
      const result = token ?
        await this.authenticatedGet(url, token, sort) :
        await this.get(url, sort);
      results.push({ sort, result });
    }

    return results;
  }

  /**
   * Test file upload
   */
  async testFileUpload(url: string, token: string, filePath: string, fieldName: string = 'file') {
    return request(this.app.getHttpServer())
      .post(url)
      .set('Authorization', `Bearer ${token}`)
      .attach(fieldName, filePath);
  }

  /**
   * Create test helper instance
   */
  static create(app: INestApplication): ApiTestHelpers {
    return new ApiTestHelpers(app);
  }

  /**
   * Wait for async operations
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.wait(delay);
      }
    }

    throw lastError;
  }
}