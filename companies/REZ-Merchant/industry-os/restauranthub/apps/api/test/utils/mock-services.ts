import { jest } from '@jest/globals';

/**
 * Mock PrismaService with all commonly used methods
 */
export const createMockPrismaService = () => ({
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),

  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },

  profile: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  restaurant: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },

  order: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },

  orderItem: {
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },

  job: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },

  jobApplication: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  employee: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  vendor: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  product: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  session: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  notification: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },

  review: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },

  message: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
});

/**
 * Mock RedisService
 */
export const createMockRedisService = () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  clear: jest.fn(),
  flushall: jest.fn(),
  hget: jest.fn(),
  hset: jest.fn(),
  hdel: jest.fn(),
  hgetall: jest.fn(),
  lpush: jest.fn(),
  rpush: jest.fn(),
  lpop: jest.fn(),
  rpop: jest.fn(),
  lrange: jest.fn(),
  sadd: jest.fn(),
  srem: jest.fn(),
  smembers: jest.fn(),
  sismember: jest.fn(),
  zadd: jest.fn(),
  zrange: jest.fn(),
  zrem: jest.fn(),
  zrank: jest.fn(),
  incr: jest.fn(),
  decr: jest.fn(),
  incrby: jest.fn(),
  decrby: jest.fn(),
});

/**
 * Mock JwtService
 */
export const createMockJwtService = () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ sub: 'user-id', email: 'test@example.com' }),
  decode: jest.fn(),
  signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
  verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-id', email: 'test@example.com' }),
});

/**
 * Mock EmailService
 */
export const createMockEmailService = () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendBulkEmail: jest.fn().mockResolvedValue(undefined),
  getAvailableTemplates: jest.fn().mockResolvedValue({
    templates: ['welcome', 'email-verification', 'password-reset'],
  }),
  getQueueStatus: jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
  }),
  getEmailLogs: jest.fn().mockResolvedValue({
    logs: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }),
  getEmailStats: jest.fn().mockResolvedValue({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalBounced: 0,
    totalOpened: 0,
    totalClicked: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
  }),
});

/**
 * Mock ConfigService
 */
export const createMockConfigService = () => ({
  get: jest.fn((key: string, defaultValue?) => {
    const config = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      REDIS_URL: 'redis://localhost:6379',
      EMAIL_FROM: 'test@example.com',
      SMTP_HOST: 'localhost',
      SMTP_PORT: 587,
      SMTP_USER: 'test',
      SMTP_PASS: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      NODE_ENV: 'test',
      PORT: 3001,
      RATE_LIMIT_TTL: 60,
      RATE_LIMIT_LIMIT: 10,
      UPLOAD_MAX_SIZE: 10485760, // 10MB
      CORS_ORIGIN: 'http://localhost:3000',
    };
    return config[key] || defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    const config = createMockConfigService().get(key);
    if (config === undefined) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return config;
  }),
});

/**
 * Mock FileUploadService
 */
export const createMockFileUploadService = () => ({
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://example.com/uploaded-file.jpg',
    publicId: 'test-public-id',
    filename: 'test-file.jpg',
    size: 1024,
    format: 'jpg',
  }),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  uploadMultiple: jest.fn().mockResolvedValue([
    {
      url: 'https://example.com/file1.jpg',
      publicId: 'test-public-id-1',
      filename: 'file1.jpg',
      size: 1024,
      format: 'jpg',
    },
    {
      url: 'https://example.com/file2.jpg',
      publicId: 'test-public-id-2',
      filename: 'file2.jpg',
      size: 2048,
      format: 'jpg',
    },
  ]),
  getUploadUrl: jest.fn().mockResolvedValue({
    uploadUrl: 'https://example.com/upload',
    publicId: 'test-public-id',
  }),
  validateFile: jest.fn().mockReturnValue(true),
  processImage: jest.fn().mockResolvedValue({
    url: 'https://example.com/processed-image.jpg',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
  }),
});

/**
 * Mock PaymentService
 */
export const createMockPaymentService = () => ({
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_payment_intent',
    clientSecret: 'pi_test_payment_intent_secret',
    amount: 1000,
    currency: 'inr',
    status: 'requires_payment_method',
  }),
  confirmPayment: jest.fn().mockResolvedValue({
    id: 'pi_test_payment_intent',
    status: 'succeeded',
    amount: 1000,
    currency: 'inr',
  }),
  refundPayment: jest.fn().mockResolvedValue({
    id: 're_test_refund',
    amount: 1000,
    currency: 'inr',
    status: 'succeeded',
  }),
  getPaymentHistory: jest.fn().mockResolvedValue({
    payments: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  }),
  createCustomer: jest.fn().mockResolvedValue({
    id: 'cus_test_customer',
    email: 'test@example.com',
  }),
  updateCustomer: jest.fn().mockResolvedValue({
    id: 'cus_test_customer',
    email: 'updated@example.com',
  }),
});

/**
 * Mock WebSocketService
 */
export const createMockWebSocketService = () => ({
  sendToUser: jest.fn().mockResolvedValue(undefined),
  sendToRole: jest.fn().mockResolvedValue(undefined),
  sendToRestaurant: jest.fn().mockResolvedValue(undefined),
  sendToVendor: jest.fn().mockResolvedValue(undefined),
  broadcastOrderUpdate: jest.fn().mockResolvedValue(undefined),
  broadcastNewOrder: jest.fn().mockResolvedValue(undefined),
  broadcastJobUpdate: jest.fn().mockResolvedValue(undefined),
  sendMessage: jest.fn().mockResolvedValue(undefined),
  broadcastCommunityUpdate: jest.fn().mockResolvedValue(undefined),
  broadcastSystemAnnouncement: jest.fn().mockResolvedValue(undefined),
});

/**
 * Create a complete mock module for testing
 */
export const createTestModule = (additionalProviders: unknown[] = []) => ({
  providers: [
    { provide: 'PrismaService', useValue: createMockPrismaService() },
    { provide: 'RedisService', useValue: createMockRedisService() },
    { provide: 'JwtService', useValue: createMockJwtService() },
    { provide: 'EmailService', useValue: createMockEmailService() },
    { provide: 'ConfigService', useValue: createMockConfigService() },
    { provide: 'FileUploadService', useValue: createMockFileUploadService() },
    { provide: 'PaymentService', useValue: createMockPaymentService() },
    { provide: 'WebSocketService', useValue: createMockWebSocketService() },
    ...additionalProviders,
  ],
});

/**
 * Helper to create mock Express request
 */
export const createMockRequest = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER',
  },
  body: {},
  params: {},
  query: {},
  headers: {
    'user-agent': 'test-agent',
    'x-forwarded-for': '127.0.0.1',
  },
  ip: '127.0.0.1',
  method: 'GET',
  url: '/test',
  originalUrl: '/test',
  ...overrides,
});

/**
 * Helper to create mock Express response
 */
export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Helper to create mock file upload
 */
export const createMockFile = (overrides = {}) => ({
  fieldname: 'file',
  originalname: 'test-file.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  size: 1024,
  buffer: Buffer.from('test-file-content'),
  filename: 'test-file.jpg',
  path: '/tmp/test-file.jpg',
  destination: '/tmp',
  ...overrides,
});

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  measureExecutionTime: async (fn: () => Promise<unknown>) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return { result, duration };
  },

  expectPerformance: (duration: number, maxDuration: number) => {
    expect(duration).toBeLessThan(maxDuration);
  },

  createMemorySnapshot: () => {
    const used = process.memoryUsage();
    return {
      rss: used.rss / 1024 / 1024, // MB
      heapTotal: used.heapTotal / 1024 / 1024, // MB
      heapUsed: used.heapUsed / 1024 / 1024, // MB
      external: used.external / 1024 / 1024, // MB
    };
  },
};