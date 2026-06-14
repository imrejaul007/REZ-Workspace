/**
 * Test Setup for UGC Management Service
 * Configures Jest with proper mocks for MongoDB, external APIs, and services
 */

// Mock mongoose
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
jest.mock('../config/logger', () => ({
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
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Mock console
const originalConsole = { ...console };

beforeAll(() => {
  if (!process.env.DEBUG_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
  }
});

afterAll(() => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

// Test utilities
export const mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: { 'x-user-id': 'test-user-id' },
  ...overrides,
});

export const mockResponse = () => {
  const res: Record<string, jest.Mock> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();

export const createMockUGCContent = (overrides = {}) => ({
  _id: 'ugc-123',
  platform: 'instagram',
  originalUrl: 'https://instagram.com/p/abc123',
  mediaUrl: 'https://example.com/media.jpg',
  mediaType: 'image',
  caption: 'Amazing product! #love #product',
  author: {
    platformUserId: 'user-123',
    username: 'testuser',
    displayName: 'Test User',
    followerCount: 5000,
  },
  hashtags: ['#love', '#product'],
  engagement: {
    likes: 100,
    comments: 10,
    shares: 5,
  },
  status: 'pending_review',
  rightsStatus: 'none',
  displayedOn: [],
  sentiment: 'positive',
  sentimentScore: 0.8,
  createdAt: new Date(),
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

export const createMockUGCCampaign = (overrides = {}) => ({
  _id: 'campaign-123',
  name: 'Test Campaign',
  description: 'Test campaign description',
  platforms: ['instagram', 'twitter'],
  hashtags: ['#test', '#ugc'],
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  status: 'active',
  moderationRules: {
    minFollowers: 1000,
    maxFollowers: 1000000,
    excludeHashtags: ['#spam', '#scam'],
    requireHashtags: ['#test'],
    excludeAccounts: [],
    sentimentThreshold: 0.3,
  },
  approvalRequired: true,
  stats: {
    collected: 100,
    pending: 50,
    approved: 40,
    rejected: 10,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUGCRights = (overrides = {}) => ({
  _id: 'rights-123',
  ugcId: 'ugc-123',
  rightsType: 'display',
  usageTerms: 'For promotional use only',
  requestedBy: 'brand-123',
  requestedAt: new Date(),
  status: 'pending',
  respondedBy: null,
  respondedAt: null,
  expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  ...overrides,
});

export const mockError = (message: string, statusCode = 500) => {
  const error = new Error(message);
  (error as Error& { statusCode?: number }).statusCode = statusCode;
  return error;
};