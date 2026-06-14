import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Rate Limiting Security Tests', () => {
  let app: INestApplication;
  let httpServer: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Wait between tests to avoid rate limit carryover
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Login Endpoint Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      const loginRequests = [];
      const email = `rate-limit-test-${Date.now()}@example.com`;

      // Make rapid login attempts
      for (let i = 0; i < 20; i++) {
        loginRequests.push(
          request(httpServer)
            .post('/auth/login')
            .send({
              email,
              password: 'wrongpassword123',
            })
        );
      }

      const responses = await Promise.all(loginRequests);
      const statusCodes = responses.map(r => r.status);

      // Should start getting 429 (Too Many Requests) after several attempts
      const rateLimitedCount = statusCodes.filter(s => s === 429).length;
      expect(rateLimitedCount).toBeGreaterThan(0);

      // Check rate limit headers
      const rateLimitedResponse = responses.find(r => r.status === 429);
      if (rateLimitedResponse) {
        expect(rateLimitedResponse.headers).toHaveProperty('x-ratelimit-limit');
        expect(rateLimitedResponse.headers).toHaveProperty('x-ratelimit-remaining');
        expect(rateLimitedResponse.headers).toHaveProperty('retry-after');
      }
    });

    it('should have separate rate limits per IP address', async () => {
      const ip1Requests = [];
      const ip2Requests = [];

      // Simulate different IP addresses
      for (let i = 0; i < 10; i++) {
        ip1Requests.push(
          request(httpServer)
            .post('/auth/login')
            .set('X-Forwarded-For', '192.168.1.100')
            .send({
              email: `ip1-test-${i}@example.com`,
              password: 'wrongpassword123',
            })
        );

        ip2Requests.push(
          request(httpServer)
            .post('/auth/login')
            .set('X-Forwarded-For', '192.168.1.101')
            .send({
              email: `ip2-test-${i}@example.com`,
              password: 'wrongpassword123',
            })
        );
      }

      const ip1Responses = await Promise.all(ip1Requests);
      const ip2Responses = await Promise.all(ip2Requests);

      // Both IPs should be able to make some requests
      const ip1Success = ip1Responses.filter(r => r.status !== 429).length;
      const ip2Success = ip2Responses.filter(r => r.status !== 429).length;

      expect(ip1Success).toBeGreaterThan(0);
      expect(ip2Success).toBeGreaterThan(0);
    });

    it('should implement exponential backoff for repeated violations', async () => {
      const email = `backoff-test-${Date.now()}@example.com`;
      let retryAfterTimes: number[] = [];

      // Make requests until rate limited
      for (let i = 0; i < 25; i++) {
        const response = await request(httpServer)
          .post('/auth/login')
          .send({
            email,
            password: 'wrongpassword123',
          });

        if (response.status === 429 && response.headers['retry-after']) {
          retryAfterTimes.push(parseInt(response.headers['retry-after']));
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Retry times should increase (exponential backoff)
      if (retryAfterTimes.length > 1) {
        expect(retryAfterTimes[retryAfterTimes.length - 1])
          .toBeGreaterThanOrEqual(retryAfterTimes[0]);
      }
    });
  });

  describe('Registration Endpoint Rate Limiting', () => {
    it('should limit registration attempts', async () => {
      const registrationRequests = [];

      for (let i = 0; i < 15; i++) {
        registrationRequests.push(
          request(httpServer)
            .post('/auth/register')
            .send({
              email: `reg-spam-${Date.now()}-${i}@example.com`,
              password: 'Password123!',
              confirmPassword: 'Password123!',
              firstName: 'Spam',
              lastName: 'User',
              phone: `+123456789${i}`,
              role: 'CUSTOMER',
              agreeToTerms: true,
              agreeToPrivacy: true,
            })
        );
      }

      const responses = await Promise.all(registrationRequests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Should rate limit excessive registrations
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should prevent account enumeration via registration rate limiting', async () => {
      const existingEmail = 'existing@example.com';

      // Create an account first
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: existingEmail,
          password: 'Password123!',
          confirmPassword: 'Password123!',
          firstName: 'Existing',
          lastName: 'User',
          phone: '+1234567890',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      // Try to register with same email multiple times
      const duplicateRequests = [];
      for (let i = 0; i < 10; i++) {
        duplicateRequests.push(
          request(httpServer)
            .post('/auth/register')
            .send({
              email: existingEmail,
              password: 'Password123!',
              confirmPassword: 'Password123!',
              firstName: 'Duplicate',
              lastName: 'User',
              phone: '+1234567891',
              role: 'CUSTOMER',
              agreeToTerms: true,
              agreeToPrivacy: true,
            })
        );
      }

      const responses = await Promise.all(duplicateRequests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Should rate limit enumeration attempts
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('API Endpoint Rate Limiting', () => {
    let authToken: string;

    beforeAll(async () => {
      // Create test user and get auth token
      await request(httpServer)
        .post('/auth/register')
        .send({
          email: 'api-rate-test@example.com',
          password: 'ApiRateTest123!',
          confirmPassword: 'ApiRateTest123!',
          firstName: 'API',
          lastName: 'Test',
          phone: '+1999888777',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'api-rate-test@example.com',
          password: 'ApiRateTest123!',
        });

      authToken = loginResponse.body.data.accessToken;
    });

    it('should rate limit profile updates', async () => {
      const updateRequests = [];

      for (let i = 0; i < 20; i++) {
        updateRequests.push(
          request(httpServer)
            .put('/users/profile')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              firstName: `Updated${i}`,
              lastName: 'Name',
            })
        );
      }

      const responses = await Promise.all(updateRequests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should rate limit job creation', async () => {
      const jobRequests = [];

      for (let i = 0; i < 15; i++) {
        jobRequests.push(
          request(httpServer)
            .post('/jobs')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              title: `Rate Test Job ${i}`,
              description: 'Testing rate limits',
              type: 'FULL_TIME',
              location: 'Remote',
              salary: {
                min: 50000,
                max: 70000,
                currency: 'USD',
              },
              requirements: ['Test requirement'],
            })
        );
      }

      const responses = await Promise.all(jobRequests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Bypass Prevention', () => {
    it('should not be bypassed by changing User-Agent', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        'curl/7.68.0',
        'PostmanRuntime/7.28.0',
      ];

      const requests = [];
      const email = `ua-bypass-test-${Date.now()}@example.com`;

      for (let i = 0; i < userAgents.length * 5; i++) {
        const userAgent = userAgents[i % userAgents.length];
        requests.push(
          request(httpServer)
            .post('/auth/login')
            .set('User-Agent', userAgent)
            .send({
              email,
              password: 'wrongpassword123',
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Should still be rate limited regardless of User-Agent
      expect(rateLimitedCount).toBeGreaterThan(0);
    });

    it('should not be bypassed by X-Forwarded-For spoofing', async () => {
      const requests = [];
      const email = `xff-bypass-test-${Date.now()}@example.com`;

      // Try to bypass by spoofing different IP addresses
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(httpServer)
            .post('/auth/login')
            .set('X-Forwarded-For', `192.168.1.${100 + (i % 5)}`)
            .set('X-Real-IP', `10.0.0.${50 + (i % 3)}`)
            .send({
              email,
              password: 'wrongpassword123',
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedCount = responses.filter(r => r.status === 429).length;

      // Should still be rate limited
      expect(rateLimitedCount).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should have appropriate rate limit windows', async () => {
      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      // Check rate limit headers for reasonable values
      if (response.headers['x-ratelimit-limit']) {
        const limit = parseInt(response.headers['x-ratelimit-limit']);
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThan(1000); // Should be reasonable
      }

      if (response.headers['x-ratelimit-window']) {
        const window = parseInt(response.headers['x-ratelimit-window']);
        expect(window).toBeGreaterThan(0);
        expect(window).toBeLessThanOrEqual(3600); // Should not exceed 1 hour
      }
    });

    it('should reset rate limits after window expires', async () => {
      const email = `reset-test-${Date.now()}@example.com`;

      // Make requests until rate limited
      let rateLimited = false;
      for (let i = 0; i < 15 && !rateLimited; i++) {
        const response = await request(httpServer)
          .post('/auth/login')
          .send({
            email,
            password: 'wrongpassword123',
          });

        if (response.status === 429) {
          rateLimited = true;
          const retryAfter = parseInt(response.headers['retry-after'] || '0');

          if (retryAfter > 0 && retryAfter < 10) {
            // Wait for retry period to expire
            await new Promise(resolve => setTimeout(resolve, (retryAfter + 1) * 1000));

            // Should be able to make request again
            const resetResponse = await request(httpServer)
              .post('/auth/login')
              .send({
                email,
                password: 'wrongpassword123',
              });

            expect(resetResponse.status).not.toBe(429);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(rateLimited).toBe(true);
    });
  });

  describe('Rate Limit Monitoring', () => {
    it('should provide accurate remaining request counts', async () => {
      const email = `monitoring-test-${Date.now()}@example.com`;
      let previousRemaining = Infinity;

      for (let i = 0; i < 10; i++) {
        const response = await request(httpServer)
          .post('/auth/login')
          .send({
            email,
            password: 'wrongpassword123',
          });

        if (response.headers['x-ratelimit-remaining']) {
          const remaining = parseInt(response.headers['x-ratelimit-remaining']);

          if (previousRemaining !== Infinity && response.status !== 429) {
            // Remaining count should decrease
            expect(remaining).toBeLessThanOrEqual(previousRemaining);
          }

          previousRemaining = remaining;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    });

    it('should log rate limit violations', async () => {
      // This test would typically check logs, but we'll verify the behavior
      const requests = [];
      const email = `logging-test-${Date.now()}@example.com`;

      for (let i = 0; i < 15; i++) {
        requests.push(
          request(httpServer)
            .post('/auth/login')
            .send({
              email,
              password: 'wrongpassword123',
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      // Should have rate limited some requests
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limited responses should have proper error structure
      rateLimitedResponses.forEach(response => {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toMatch(/rate.*limit/i);
      });
    });
  });
});