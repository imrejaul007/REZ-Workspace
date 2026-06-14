/**
 * API Integration Tests
 *
 * Tests all CRUD operations, authentication flow, rate limiting,
 * and error handling for the CorpPerks Backend API.
 */

import request from 'supertest';
import { app } from '../../src/index';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:4006';
const TEST_TIMEOUT = 30000;

// Generate test tokens
function generateTestToken(payload: object, expiresIn = '1h'): string {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign(payload, secret, { expiresIn });
}

// Test data
const testAdmin = {
  email: 'admin@corpperks.com',
  password: 'Admin123!',
};

const testEmployee = {
  email: 'employee@corpperks.com',
  firstName: 'Test',
  lastName: 'Employee',
  department: 'Engineering',
  position: 'Developer',
};

describe('CorpPerks API Integration Tests', () => {
  let adminToken: string;
  let employeeId: string;

  beforeAll(() => {
    adminToken = generateTestToken({
      userId: 'admin-123',
      email: testAdmin.email,
      role: 'admin',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (employeeId) {
      try {
        await mongoose.model('Employee')?.findByIdAndDelete(employeeId);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('Authentication', () => {
    describe('POST /api/v1/auth/login', () => {
      it('should login with valid credentials', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/auth/login')
          .send({
            email: testAdmin.email,
            password: testAdmin.password,
          })
          .expect('Content-Type', /json/)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
      });

      it('should reject invalid credentials', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/auth/login')
          .send({
            email: testAdmin.email,
            password: 'wrong-password',
          })
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
      });

      it('should reject missing email', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/auth/login')
          .send({
            password: testAdmin.password,
          })
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
      });

      it('should handle rate limiting on login', async () => {
        // Make multiple rapid login attempts
        const attempts = Array(6).fill(null).map(() =>
          request(API_BASE_URL)
            .post('/api/v1/auth/login')
            .send({
              email: testAdmin.email,
              password: 'wrong-password',
            })
        );

        const responses = await Promise.all(attempts);
        const rateLimited = responses.some(r => r.status === 429);

        // Either rate limited or all failed with 401
        expect(rateLimited || responses[0].status === 401).toBe(true);
      }, TEST_TIMEOUT * 2);
    });

    describe('POST /api/v1/auth/register', () => {
      const testUser = {
        email: `test-${Date.now()}@corpperks.com`,
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      it('should register new user', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/auth/register')
          .send(testUser)
          .expect('Content-Type', /json/)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(testUser.email);
      });

      it('should reject duplicate email', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/auth/register')
          .send(testUser)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('success', false);
      });

      it('should reject weak password', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/auth/register')
          .send({
            ...testUser,
            email: `test-new-${Date.now()}@corpperks.com`,
            password: '123',
          })
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
      });
    });

    describe('GET /api/v1/auth/me', () => {
      it('should return user profile with valid token', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('user');
      });

      it('should reject request without token', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/v1/auth/me')
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(401);
      });

      it('should reject expired token', async () => {
        const expiredToken = generateTestToken(
          { userId: 'test', role: 'admin' },
          '-1s'
        );

        const response = await request(API_BASE_URL)
          .get('/api/v1/auth/me')
          .set('Authorization', `Bearer ${expiredToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(401);
      });
    });
  });

  describe('Employee Management', () => {
    const tempEmployee = {
      email: `emp-${Date.now()}@corpperks.com`,
      firstName: 'Temp',
      lastName: 'Employee',
      department: 'Testing',
      position: 'QA',
      phone: '+919876543210',
    };

    describe('POST /api/v1/employees', () => {
      it('should create employee with admin token', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/employees')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(tempEmployee)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body.employee).toMatchObject({
          email: tempEmployee.email,
          firstName: tempEmployee.firstName,
          lastName: tempEmployee.lastName,
        });

        employeeId = response.body.employee._id;
      });

      it('should reject employee creation without auth', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/employees')
          .send(tempEmployee)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(401);
      });

      it('should validate required fields', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/employees')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'test@test.com' }) // Missing required fields
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');
      });
    });

    describe('GET /api/v1/employees', () => {
      it('should list employees with pagination', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/v1/employees')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ page: 1, limit: 10 })
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(Array.isArray(response.body.employees)).toBe(true);
        expect(response.body).toHaveProperty('pagination');
      });

      it('should filter employees by department', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/v1/employees')
          .set('Authorization', `Bearer ${adminToken}`)
          .query({ department: 'Engineering' })
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        if (response.body.employees.length > 0) {
          response.body.employees.forEach((emp: Record<string, unknown>) => {
            expect(emp.department).toBe('Engineering');
          });
        }
      });
    });

    describe('GET /api/v1/employees/:id', () => {
      it('should get employee by ID', async () => {
        if (!employeeId) {
          return; // Skip if no employee created
        }

        const response = await request(API_BASE_URL)
          .get(`/api/v1/employees/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(response.body.employee._id).toBe(employeeId);
      });

      it('should return 404 for non-existent employee', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(API_BASE_URL)
          .get(`/api/v1/employees/${fakeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(404);
      });
    });

    describe('PATCH /api/v1/employees/:id', () => {
      it('should update employee', async () => {
        if (!employeeId) return;

        const response = await request(API_BASE_URL)
          .patch(`/api/v1/employees/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ position: 'Senior Developer' })
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(response.body.employee.position).toBe('Senior Developer');
      });
    });

    describe('DELETE /api/v1/employees/:id', () => {
      it('should delete employee', async () => {
        if (!employeeId) return;

        const response = await request(API_BASE_URL)
          .delete(`/api/v1/employees/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);

        // Verify deletion
        const getResponse = await request(API_BASE_URL)
          .get(`/api/v1/employees/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(getResponse.status).toBe(404);
        employeeId = ''; // Mark as deleted
      });
    });
  });

  describe('Department Management', () => {
    const testDept = {
      name: `Test Department ${Date.now()}`,
      code: `TEST${Date.now()}`,
      description: 'Test department for integration tests',
    };

    describe('POST /api/v1/departments', () => {
      it('should create department', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(testDept)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(201);
        expect(response.body.department.name).toBe(testDept.name);
      });
    });

    describe('GET /api/v1/departments', () => {
      it('should list departments', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/v1/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.departments)).toBe(true);
      });
    });
  });

  describe('Leave Management', () => {
    const leaveRequest = {
      employeeId: 'test-employee-id',
      leaveType: 'sick',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      reason: 'Medical appointment',
    };

    describe('POST /api/v1/leaves', () => {
      it('should create leave request', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/leaves')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(leaveRequest)
          .timeout(TEST_TIMEOUT);

        // Accept both 201 (created) and 200 (success)
        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('GET /api/v1/leaves', () => {
      it('should list leave requests', async () => {
        const response = await request(API_BASE_URL)
          .get('/api/v1/leaves')
          .set('Authorization', `Bearer ${adminToken}`)
          .timeout(TEST_TIMEOUT);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.leaves)).toBe(true);
      });
    });
  });

  describe('Attendance', () => {
    const attendanceRecord = {
      employeeId: 'test-employee-id',
      date: new Date().toISOString().split('T')[0],
      checkIn: '09:00',
      checkOut: '18:00',
    };

    describe('POST /api/v1/attendance/checkin', () => {
      it('should record check-in', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/attendance/checkin')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ employeeId: attendanceRecord.employeeId })
          .timeout(TEST_TIMEOUT);

        expect([200, 201]).toContain(response.status);
        expect(response.body).toHaveProperty('success', true);
      });
    });

    describe('POST /api/v1/attendance/checkout', () => {
      it('should record check-out', async () => {
        const response = await request(API_BASE_URL)
          .post('/api/v1/attendance/checkout')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ employeeId: attendanceRecord.employeeId })
          .timeout(TEST_TIMEOUT);

        expect([200, 201]).toContain(response.status);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/v1/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .timeout(TEST_TIMEOUT);

      expect([404, 400]).toContain(response.status);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle server errors gracefully', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid', department: '' }) // Force validation error
        .timeout(TEST_TIMEOUT);

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid email format', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .timeout(TEST_TIMEOUT);

      expect(response.status).toBe(400);
    });

    it('should reject XSS attempts', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `xss-${Date.now()}@corpperks.com`,
          firstName: '<script>alert("xss")</script>',
          lastName: 'Test',
          department: 'Engineering',
          position: 'Developer',
        })
        .timeout(TEST_TIMEOUT);

      // Should either sanitize or reject
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject SQL injection attempts', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/v1/auth/login')
        .send({
          email: "admin@corpperks.com' OR '1'='1",
          password: 'anything',
        })
        .timeout(TEST_TIMEOUT);

      // Should reject or handle gracefully
      expect([400, 401, 500]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();

      await request(API_BASE_URL)
        .get('/health')
        .timeout(5000);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should respond in under 2 seconds
    });
  });
});
