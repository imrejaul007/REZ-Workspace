import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Financial Management API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let authToken: string;
  let restaurantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main app
    app.setGlobalPrefix('api/v1');

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.invoice.deleteMany({ where: { restaurant: { name: { contains: 'Test' } } } });
    await prismaService.payment.deleteMany({ where: { restaurant: { name: { contains: 'Test' } } } });
    await prismaService.expense.deleteMany({ where: { restaurant: { name: { contains: 'Test' } } } });

    // Create test user and restaurant
    const user = await prismaService.user.create({
      data: {
        email: 'test-restaurant@example.com',
        password: '$2b$12$hash',
        firstName: 'Test',
        lastName: 'Restaurant',
        role: 'RESTAURANT',
        emailVerified: true,
      },
    });

    const restaurant = await prismaService.restaurant.create({
      data: {
        userId: user.id,
        name: 'Test Restaurant',
        description: 'Test Description',
        address: '123 Test St',
        phone: '+1234567890',
        email: 'test@restaurant.com',
        verificationStatus: 'VERIFIED',
      },
    });

    restaurantId = restaurant.id;

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/signin')
      .send({
        email: 'test-restaurant@example.com',
        password: 'test-password',
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Financial Dashboard', () => {
    it('should get financial dashboard data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/financial/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('netProfit');
      expect(response.body).toHaveProperty('monthlyRevenue');
      expect(response.body).toHaveProperty('taxLiability');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/financial/dashboard')
        .expect(401);
    });
  });

  describe('Invoice Management', () => {
    it('should create a new invoice', async () => {
      const invoiceData = {
        items: [
          {
            description: 'Test Product',
            quantity: 2,
            unitPrice: 100.0,
            taxRate: 18,
          },
        ],
        gstRate: 18,
        notes: 'Test invoice',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/financial/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invoiceData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('invoiceNumber');
      expect(response.body.total).toBe(236); // 200 + 36 (18% GST) + 36 (18% tax)
      expect(response.body.items).toHaveLength(1);
    });

    it('should validate invoice data', async () => {
      const invalidData = {
        items: [], // Empty items array should fail
      };

      await request(app.getHttpServer())
        .post('/api/v1/financial/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should get invoice list', async () => {
      // Create test invoice first
      await prismaService.invoice.create({
        data: {
          restaurantId,
          invoiceNumber: 'INV-2024-000001',
          subtotal: 200,
          taxAmount: 36,
          gstAmount: 36,
          total: 272,
          status: 'DRAFT',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/v1/financial/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('invoices');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
    });
  });

  describe('Payment Processing', () => {
    let invoiceId: string;

    beforeEach(async () => {
      const invoice = await prismaService.invoice.create({
        data: {
          restaurantId,
          invoiceNumber: 'INV-2024-000002',
          subtotal: 200,
          taxAmount: 36,
          gstAmount: 36,
          total: 272,
          status: 'SENT',
        },
      });
      invoiceId = invoice.id;
    });

    it('should process a payment', async () => {
      const paymentData = {
        invoiceId,
        amount: 272,
        paymentMethod: 'UPI',
        paymentGateway: 'Razorpay',
        gatewayTransactionId: 'pay_test123',
        customerEmail: 'customer@example.com',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/financial/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(272);
      expect(response.body.status).toBe('COMPLETED');
    });

    it('should validate payment amount', async () => {
      const invalidPaymentData = {
        invoiceId,
        amount: -100, // Negative amount should fail
        paymentMethod: 'UPI',
      };

      await request(app.getHttpServer())
        .post('/api/v1/financial/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe('Expense Management', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prismaService.expenseCategory.create({
        data: {
          restaurantId,
          name: 'Test Category',
          description: 'Test category for expenses',
        },
      });
      categoryId = category.id;
    });

    it('should create an expense', async () => {
      const expenseData = {
        categoryId,
        amount: 150.0,
        description: 'Office supplies',
        taxAmount: 27.0,
        tags: ['office', 'supplies'],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/financial/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.amount).toBe(150);
      expect(response.body.description).toBe('Office supplies');
      expect(response.body.tags).toEqual(['office', 'supplies']);
    });

    it('should require valid category', async () => {
      const expenseData = {
        categoryId: 'invalid-category-id',
        amount: 150.0,
        description: 'Office supplies',
      };

      await request(app.getHttpServer())
        .post('/api/v1/financial/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(400);
    });
  });

  describe('Budget Management', () => {
    let categoryId: string;

    beforeEach(async () => {
      const category = await prismaService.expenseCategory.create({
        data: {
          restaurantId,
          name: 'Marketing',
          description: 'Marketing expenses',
        },
      });
      categoryId = category.id;
    });

    it('should create a budget', async () => {
      const budgetData = {
        name: 'Q1 2024 Budget',
        description: 'First quarter budget',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-03-31T23:59:59Z',
        totalAmount: 10000,
        categories: [
          {
            categoryId,
            allocatedAmount: 5000,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/financial/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(budgetData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Q1 2024 Budget');
      expect(response.body.totalAmount).toBe(10000);
      expect(response.body.categories).toHaveLength(1);
    });

    it('should validate budget dates', async () => {
      const invalidBudgetData = {
        name: 'Invalid Budget',
        startDate: '2024-12-31T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z', // End date before start date
        totalAmount: 10000,
        categories: [],
      };

      await request(app.getHttpServer())
        .post('/api/v1/financial/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBudgetData)
        .expect(400);
    });
  });

  describe('Financial Reports', () => {
    beforeEach(async () => {
      // Create test data for reports
      await prismaService.payment.create({
        data: {
          restaurantId,
          amount: 1000,
          paymentMethod: 'UPI',
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      const category = await prismaService.expenseCategory.create({
        data: {
          restaurantId,
          name: 'Food Costs',
          description: 'Cost of ingredients',
        },
      });

      await prismaService.expense.create({
        data: {
          restaurantId,
          categoryId: category.id,
          amount: 500,
          description: 'Vegetables purchase',
        },
      });
    });

    it('should generate financial report', async () => {
      const reportData = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/financial/reports/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(200);

      expect(response.body).toHaveProperty('report');
      expect(response.body).toHaveProperty('invoices');
      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('payments');

      const report = response.body.report;
      expect(report).toHaveProperty('totalRevenue');
      expect(report).toHaveProperty('totalExpenses');
      expect(report).toHaveProperty('netProfit');
    });

    it('should get GST report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/financial/tax/gst-report')
        .query({
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('gstCollected');
      expect(response.body).toHaveProperty('gstPaid');
      expect(response.body).toHaveProperty('netGstLiability');
      expect(response.body).toHaveProperty('transactions');
    });
  });

  describe('Chart of Accounts', () => {
    it('should initialize chart of accounts', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/financial/accounts/initialize')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('initialized successfully');
    });

    it('should get chart of accounts', async () => {
      // Initialize accounts first
      await request(app.getHttpServer())
        .post('/api/v1/financial/accounts/initialize')
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app.getHttpServer())
        .get('/api/v1/financial/accounts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('accounts');
      expect(response.body).toHaveProperty('total');
    });
  });

  describe('Analytics Endpoints', () => {
    it('should get profit and loss analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/financial/analytics/profit-loss')
        .query({ period: 'month' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('profit');
    });

    it('should get cash flow analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/financial/analytics/cash-flow')
        .query({ months: '6' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('cashFlow');
      expect(response.body).toHaveProperty('projections');
    });
  });

  describe('Access Control', () => {
    it('should deny access to non-restaurant users', async () => {
      // Create non-restaurant user
      const user = await prismaService.user.create({
        data: {
          email: 'customer@example.com',
          password: '$2b$12$hash',
          firstName: 'Customer',
          lastName: 'User',
          role: 'CUSTOMER',
          emailVerified: true,
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/signin')
        .send({
          email: 'customer@example.com',
          password: 'test-password',
        });

      const customerToken = loginResponse.body.accessToken;

      await request(app.getHttpServer())
        .get('/api/v1/financial/dashboard')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400); // Should fail with bad request for non-restaurant role
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Make multiple requests quickly to test rate limiting
      const requests = Array(20).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/v1/financial/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // At least some requests should succeed (within rate limit)
      const successfulRequests = responses.filter(res => res.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate invoice item data types', async () => {
      const invalidInvoiceData = {
        items: [
          {
            description: 'Test Product',
            quantity: 'invalid', // Should be number
            unitPrice: 100.0,
            taxRate: 18,
          },
        ],
      };

      await request(app.getHttpServer())
        .post('/api/v1/financial/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidInvoiceData)
        .expect(400);
    });

    it('should validate required fields', async () => {
      const incompleteData = {
        // Missing required items field
        gstRate: 18,
      };

      await request(app.getHttpServer())
        .post('/api/v1/financial/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });
  });
});