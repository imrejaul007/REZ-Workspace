import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import { MockPrismaService } from './utils/mock-prisma.service';

// Global test configuration
jest.setTimeout(30000);

// Mock external services
jest.mock('../src/modules/email/email.service');

// Mock Redis service if not available
const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  clear: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  incr: jest.fn(),
  decr: jest.fn(),
};

// Global test utilities
export class TestUtils {
  static async createTestApp(moduleMetadata): Promise<INestApplication> {
    // Override providers for mock database
    const providers = moduleMetadata.providers || [];
    const imports = moduleMetadata.imports || [];

    // Add mock providers if using mock database
    if (process.env.MOCK_DATABASE === 'true') {
      providers.push({
        provide: PrismaService,
        useClass: MockPrismaService,
      });
      providers.push({
        provide: 'RedisService',
        useValue: mockRedisService,
      });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      ...moduleMetadata,
      providers,
      imports,
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply same configuration as main app
    app.useGlobalPipes(
      new (await import('@nestjs/common')).ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    return app;
  }

  static async cleanupDatabase(prisma: PrismaService | MockPrismaService) {
    // Clean up test data in reverse dependency order
    await prisma.notification.deleteMany();
    await prisma.message.deleteMany();
    await prisma.session.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.review.deleteMany();
    await prisma.job.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.product.deleteMany();
    await prisma.vendor.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    // If using mock database, call cleanup method
    if (prisma instanceof MockPrismaService) {
      await prisma.cleanup();
    }
  }

  static async cleanupRedis(redis) {
    // Clear test cache data
    if (redis && typeof redis.clear === 'function') {
      await redis.clear();
    }
  }

  static generateMockUser(overrides = {}) {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isActive: true,
      passwordHash: '$2b$12$test.hash',
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
      ...overrides,
    };
  }

  static generateMockRestaurant(overrides = {}) {
    return {
      id: 'test-restaurant-id',
      name: 'Test Restaurant',
      description: 'Test Description',
      address: 'Test Address',
      city: 'Test City',
      cuisineType: ['Indian'],
      isActive: true,
      status: 'ACTIVE',
      ...overrides,
    };
  }

  static generateMockOrder(overrides = {}) {
    return {
      id: 'test-order-id',
      customerId: 'test-customer-id',
      restaurantId: 'test-restaurant-id',
      status: 'PENDING',
      totalAmount: 100,
      currency: 'INR',
      orderItems: [],
      ...overrides,
    };
  }
}

// Global mocks for external dependencies
global.fetch = jest.fn();
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};