/**
 * Test Setup for Content Repurposing Engine
 * Configures Jest with proper mocks for MongoDB, external APIs, and services
 */

// Mock mongoose before any imports
jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  return {
    ...mongoose,
    connect: jest.fn().mockResolvedValue(mongoose.connection),
    disconnect: jest.fn().mockResolvedValue(undefined),
    connection: {
      readyState: 1,
    },
  };
});

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock config
jest.mock('../config', () => ({
  config: {
    port: 3000,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://localhost:27017/test',
    jwtSecret: 'test-secret',
    apiVersion: 'v1',
  },
}));

// Mock database connection
jest.mock('../config/database', () => ({
  connectDatabase: jest.fn().mockResolvedValue({}),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Global test timeout
jest.setTimeout(10000);

// Mock console to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless debugging
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
  }
});

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.info = originalConsole.info;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Re-export test utilities
export const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { userId: 'test-user-id' },
  ...overrides,
});

export const mockResponse = () => {
  const res: Record<string, jest.Mock> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();

export const createMockModel = <T>(data: Partial<T>[] = []) => {
  const mockSave = jest.fn().mockResolvedValue(data[0] || {});
  const mockFind = jest.fn().mockResolvedValue(data);
  const mockFindOne = jest.fn().mockResolvedValue(data[0] || null);
  const mockFindById = jest.fn().mockResolvedValue(data[0] || null);
  const mockCreate = jest.fn().mockResolvedValue(data[0] || {});
  const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  const mockDeleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
  const mockCountDocuments = jest.fn().mockResolvedValue(data.length);

  return {
    new: jest.fn().mockImplementation(() => ({
      save: mockSave,
    })),
    find: mockFind,
    findOne: mockFindOne,
    findById: mockFindById,
    create: mockCreate,
    updateOne: mockUpdateOne,
    deleteOne: mockDeleteOne,
    countDocuments: mockCountDocuments,
    save: mockSave,
  };
};

export const mockError = (message: string, statusCode = 500) => {
  const error = new Error(message);
  (error as Error & { statusCode?: number }).statusCode = statusCode;
  return error;
};