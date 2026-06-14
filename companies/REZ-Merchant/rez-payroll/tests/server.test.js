/**
 * REZ Payroll Service Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

describe('REZ Payroll Service', () => {
  let employeeId;

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('rez-payroll');
    });
  });

  describe('Employee Management', () => {
    it('should create a new employee', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({
          name: 'Rajesh Kumar',
          email: 'rajesh@company.com',
          department: 'Operations',
          designation: 'Manager',
          panCard: 'ABCDE1234F',
          bankAccount: {
            bankName: 'HDFC Bank',
            accountNumber: '1234567890',
            ifscCode: 'HDFC0001234'
          },
          salary: {
            basicSalary: 50000,
            hra: 20000,
            allowances: { transport: 5000, medical: 3000 }
          },
          statutory: {
            pfEnabled: true,
            esiEnabled: false,
            tdsEnabled: true,
            professionalTax: 200,
            uanNumber: 'UAN123456'
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.employeeId).toBeDefined();
      employeeId = res.body.employeeId;
    });

    it('should get all employees', async () => {
      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(200);
      expect(res.body.employees).toBeInstanceOf(Array);
    });

    it('should get employee by ID', async () => {
      const res = await request(app).get(`/api/employees/${employeeId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(employeeId);
    });

    it('should update employee', async () => {
      const res = await request(app)
        .put(`/api/employees/${employeeId}`)
        .send({ designation: 'Senior Manager' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter employees by department', async () => {
      const res = await request(app).get('/api/employees?department=Operations');
      expect(res.status).toBe(200);
      expect(res.body.employees).toBeInstanceOf(Array);
    });

    it('should return 404 for non-existent employee', async () => {
      const res = await request(app).get('/api/employees/NONEXISTENT');
      expect(res.status).toBe(404);
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/employees')
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
    });
  });

  describe('Attendance Management', () => {
    it('should clock in employee', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-in')
        .send({ employeeId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.record).toBeDefined();
    });

    it('should clock out employee', async () => {
      const res = await request(app)
        .post('/api/attendance/clock-out')
        .send({ employeeId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should mark employee absent', async () => {
      const res = await request(app)
        .post('/api/attendance/absent')
        .send({
          employeeId,
          date: '2026-06-01'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should apply leave', async () => {
      const res = await request(app)
        .post('/api/attendance/leave')
        .send({
          employeeId,
          date: '2026-06-15',
          leaveType: 'sick'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get monthly attendance', async () => {
      const res = await request(app)
        .get(`/api/attendance/${employeeId}`)
        .query({ month: 6, year: 2026 });

      expect(res.status).toBe(200);
      expect(res.body.records).toBeInstanceOf(Array);
      expect(res.body.summary).toBeDefined();
    });
  });

  describe('Payroll Processing', () => {
    it('should run payroll', async () => {
      const res = await request(app)
        .post('/api/payroll/run')
        .send({ month: 6, year: 2026 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.payrollRun).toBeDefined();
    });

    it('should get payroll runs', async () => {
      const res = await request(app).get('/api/payroll/runs');
      expect(res.status).toBe(200);
      expect(res.body.payrollRuns).toBeInstanceOf(Array);
    });

    it('should approve payroll run', async () => {
      const runsRes = await request(app).get('/api/payroll/runs');
      if (runsRes.body.payrollRuns.length > 0) {
        const runId = runsRes.body.payrollRuns[0].id;
        const res = await request(app).post(`/api/payroll/${runId}/approve`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('should disburse payroll', async () => {
      const runsRes = await request(app).get('/api/payroll/runs');
      if (runsRes.body.payrollRuns.length > 0) {
        const runId = runsRes.body.payrollRuns[0].id;
        const res = await request(app).post(`/api/payroll/${runId}/disburse`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });
  });

  describe('Salary Slips', () => {
    it('should get employee salary slips', async () => {
      const res = await request(app)
        .get(`/api/salary-slips/employee/${employeeId}`);

      expect(res.status).toBe(200);
      expect(res.body.salarySlips).toBeInstanceOf(Array);
    });
  });

  describe('Statutory Compliance', () => {
    it('should validate PF compliance', async () => {
      const res = await request(app)
        .post('/api/compliance/pf')
        .send({ employeeId, monthlyGross: 80000 });

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('PF');
    });

    it('should validate ESI compliance', async () => {
      const res = await request(app)
        .post('/api/compliance/esi')
        .send({ employeeId, monthlyGross: 20000 });

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('ESI');
    });

    it('should validate TDS compliance', async () => {
      const res = await request(app)
        .post('/api/compliance/tds')
        .send({ employeeId, annualIncome: 600000 });

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('TDS');
    });

    it('should get employer liability', async () => {
      const res = await request(app).post('/api/compliance/liability');
      expect(res.status).toBe(200);
      expect(res.body.totalLiability).toBeDefined();
    });

    it('should return 400 for missing employeeId on PF check', async () => {
      const res = await request(app)
        .post('/api/compliance/pf')
        .send({ monthlyGross: 50000 });

      expect(res.status).toBe(400);
    });
  });

  describe('Calculator Utilities', () => {
    it('should calculate gross salary', async () => {
      const res = await request(app)
        .post('/api/calculator/gross')
        .send({ employeeId });

      expect(res.status).toBe(200);
      expect(res.body.grossSalary).toBeDefined();
    });

    it('should calculate overtime pay', async () => {
      const res = await request(app)
        .post('/api/calculator/overtime')
        .send({ employeeId, hours: 10 });

      expect(res.status).toBe(200);
      expect(res.body.overtimePay).toBeDefined();
    });
  });

  describe('Disbursements', () => {
    it('should get disbursement summary', async () => {
      const res = await request(app)
        .get('/api/disbursements/summary')
        .query({ month: 6, year: 2026 });

      expect(res.status).toBe(200);
      expect(res.body.totalDisbursements).toBeDefined();
    });

    it('should get employee disbursements', async () => {
      const res = await request(app)
        .get(`/api/disbursements/employee/${employeeId}`);

      expect(res.status).toBe(200);
      expect(res.body.disbursements).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 for missing required fields on leave', async () => {
      const res = await request(app)
        .post('/api/attendance/leave')
        .send({ employeeId });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing required fields on absent', async () => {
      const res = await request(app)
        .post('/api/attendance/absent')
        .send({ employeeId });

      expect(res.status).toBe(400);
    });
  });
});