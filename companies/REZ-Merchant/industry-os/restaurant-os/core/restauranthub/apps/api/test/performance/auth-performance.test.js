const { Test } = require('@nestjs/testing');
const request = require('supertest');
const { AppModule } = require('../../src/app.module');

describe('Auth Performance Tests', () => {
  let app;
  let httpServer;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Response Time Performance', () => {
    it('should handle login requests within acceptable time', async () => {
      // Create test user
      const testUser = {
        email: `perf-login-${Date.now()}@example.com`,
        password: 'PerformanceTest123!',
      };

      await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          firstName: 'Performance',
          lastName: 'Test',
          phone: '+1999999999',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const startTime = Date.now();

      const response = await request(httpServer)
        .post('/auth/login')
        .send(testUser);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      console.log(`Login response time: ${responseTime}ms`);
    });

    it('should handle registration requests within acceptable time', async () => {
      const registrationData = {
        email: `perf-register-${Date.now()}@example.com`,
        password: 'PerformanceTest123!',
        confirmPassword: 'PerformanceTest123!',
        firstName: 'Performance',
        lastName: 'Register',
        phone: '+1888888888',
        role: 'CUSTOMER',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const startTime = Date.now();

      const response = await request(httpServer)
        .post('/auth/register')
        .send(registrationData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(3000); // Registration can take slightly longer due to hashing
      console.log(`Registration response time: ${responseTime}ms`);
    });

    it('should handle token refresh within acceptable time', async () => {
      // Setup: Create user and get tokens
      const testUser = {
        email: `perf-refresh-${Date.now()}@example.com`,
        password: 'PerformanceTest123!',
      };

      await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          firstName: 'Performance',
          lastName: 'Refresh',
          phone: '+1777777777',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const loginResponse = await request(httpServer)
        .post('/auth/login')
        .send(testUser);

      const tokens = loginResponse.body.data;

      const startTime = Date.now();

      const response = await request(httpServer)
        .post('/auth/refresh')
        .send({
          refreshToken: tokens.refreshToken,
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Token refresh should be fast
      console.log(`Token refresh response time: ${responseTime}ms`);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent login requests', async () => {
      // Create multiple test users
      const users = [];
      const createUserPromises = [];

      for (let i = 0; i < 10; i++) {
        const user = {
          email: `concurrent-login-${i}-${Date.now()}@example.com`,
          password: 'ConcurrentTest123!',
        };
        users.push(user);

        createUserPromises.push(
          request(httpServer)
            .post('/auth/register')
            .send({
              ...user,
              confirmPassword: user.password,
              firstName: `Concurrent${i}`,
              lastName: 'Login',
              phone: `+1${String(i).padStart(10, '5')}`,
              role: 'CUSTOMER',
              agreeToTerms: true,
              agreeToPrivacy: true,
            })
        );
      }

      await Promise.all(createUserPromises);

      // Perform concurrent login requests
      const loginPromises = users.map(user =>
        request(httpServer)
          .post('/auth/login')
          .send(user)
      );

      const startTime = Date.now();
      const responses = await Promise.all(loginPromises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / responses.length;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });

      // Average response time should be reasonable
      expect(avgResponseTime).toBeLessThan(3000);
      console.log(`Concurrent login average response time: ${avgResponseTime}ms`);
      console.log(`Total time for ${responses.length} concurrent logins: ${totalTime}ms`);
    });

    it('should handle mixed concurrent auth operations', async () => {
      const operations = [];

      // Mix of registrations, logins, and token refreshes
      for (let i = 0; i < 5; i++) {
        // Registration
        operations.push({
          type: 'register',
          request: () => request(httpServer)
            .post('/auth/register')
            .send({
              email: `mixed-register-${i}-${Date.now()}@example.com`,
              password: 'MixedTest123!',
              confirmPassword: 'MixedTest123!',
              firstName: `Mixed${i}`,
              lastName: 'Register',
              phone: `+1${String(i).padStart(10, '6')}`,
              role: 'CUSTOMER',
              agreeToTerms: true,
              agreeToPrivacy: true,
            })
        });

        // Login (using pre-created user)
        operations.push({
          type: 'login',
          request: () => request(httpServer)
            .post('/auth/login')
            .send({
              email: `mixed-login-${i}-${Date.now()}@example.com`,
              password: 'NonexistentPassword123!',
            })
        });
      }

      const startTime = Date.now();
      const responses = await Promise.all(operations.map(op => op.request()));
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      console.log(`Mixed operations total time: ${totalTime}ms`);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Check response distribution
      const statusCodes = responses.map(r => r.status);
      console.log('Status code distribution:', statusCodes.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1;
        return acc;
      }, {}));
    });
  });

  describe('Memory Usage Performance', () => {
    it('should not have memory leaks with repeated requests', async () => {
      const initialMemory = process.memoryUsage();

      // Create test user
      const testUser = {
        email: `memory-test-${Date.now()}@example.com`,
        password: 'MemoryTest123!',
      };

      await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          firstName: 'Memory',
          lastName: 'Test',
          phone: '+1666666666',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      // Perform many login requests
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          request(httpServer)
            .post('/auth/login')
            .send(testUser)
        );
      }

      await Promise.all(promises);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      console.log(`Memory increase after 100 requests: ${memoryIncrease / 1024 / 1024} MB`);

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Performance', () => {
    it('should handle user lookup efficiently', async () => {
      // Create test users
      const userCreationPromises = [];
      for (let i = 0; i < 50; i++) {
        userCreationPromises.push(
          request(httpServer)
            .post('/auth/register')
            .send({
              email: `db-perf-${i}-${Date.now()}@example.com`,
              password: 'DatabasePerf123!',
              confirmPassword: 'DatabasePerf123!',
              firstName: `DB${i}`,
              lastName: 'Performance',
              phone: `+1${String(i).padStart(10, '7')}`,
              role: 'CUSTOMER',
              agreeToTerms: true,
              agreeToPrivacy: true,
            })
        );
      }

      await Promise.all(userCreationPromises);

      // Test login performance with multiple users in database
      const startTime = Date.now();

      const response = await request(httpServer)
        .post('/auth/login')
        .send({
          email: `db-perf-25-${Date.now()}@example.com`,
          password: 'DatabasePerf123!',
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should still be fast with more users
      console.log(`Database lookup with 50 users: ${responseTime}ms`);
    });
  });

  describe('Password Hashing Performance', () => {
    it('should hash passwords within acceptable time', async () => {
      const registrationData = {
        email: `hash-perf-${Date.now()}@example.com`,
        password: 'VeryLongComplexPasswordForHashingPerformanceTest123!@#$%^&*()',
        confirmPassword: 'VeryLongComplexPasswordForHashingPerformanceTest123!@#$%^&*()',
        firstName: 'Hash',
        lastName: 'Performance',
        phone: '+1555555555',
        role: 'CUSTOMER',
        agreeToTerms: true,
        agreeToPrivacy: true,
      };

      const startTime = Date.now();

      const response = await request(httpServer)
        .post('/auth/register')
        .send(registrationData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(201);
      expect(responseTime).toBeLessThan(5000); // Password hashing can take some time
      console.log(`Password hashing time: ${responseTime}ms`);
    });

    it('should verify passwords within acceptable time', async () => {
      // Create user
      const testUser = {
        email: `verify-perf-${Date.now()}@example.com`,
        password: 'VeryLongComplexPasswordForVerificationPerformanceTest123!@#$%^&*()',
      };

      await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          firstName: 'Verify',
          lastName: 'Performance',
          phone: '+1444444444',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      const startTime = Date.now();

      const response = await request(httpServer)
        .post('/auth/login')
        .send(testUser);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Password verification should be faster than hashing
      console.log(`Password verification time: ${responseTime}ms`);
    });
  });

  describe('Token Generation Performance', () => {
    it('should generate JWT tokens quickly', async () => {
      // Create user and login to trigger token generation
      const testUser = {
        email: `token-perf-${Date.now()}@example.com`,
        password: 'TokenPerf123!',
      };

      await request(httpServer)
        .post('/auth/register')
        .send({
          ...testUser,
          confirmPassword: testUser.password,
          firstName: 'Token',
          lastName: 'Performance',
          phone: '+1333333333',
          role: 'CUSTOMER',
          agreeToTerms: true,
          agreeToPrivacy: true,
        });

      // Measure multiple token generations
      const tokenGenerationTimes = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();

        const response = await request(httpServer)
          .post('/auth/login')
          .send(testUser);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        if (response.status === 200) {
          tokenGenerationTimes.push(responseTime);
        }

        // Logout to prepare for next login
        if (response.body.data && response.body.data.accessToken) {
          await request(httpServer)
            .post('/auth/logout')
            .set('Authorization', `Bearer ${response.body.data.accessToken}`)
            .send({
              refreshToken: response.body.data.refreshToken,
            });
        }
      }

      const avgTokenTime = tokenGenerationTimes.reduce((a, b) => a + b, 0) / tokenGenerationTimes.length;

      console.log(`Average token generation time: ${avgTokenTime}ms`);
      console.log(`Token generation times:`, tokenGenerationTimes);

      expect(avgTokenTime).toBeLessThan(2000);
      expect(Math.max(...tokenGenerationTimes)).toBeLessThan(3000);
    });
  });
});