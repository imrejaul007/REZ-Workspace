/**
 * Test Setup for Unified Social Inbox Service
 */

// Mock mongoose
jest.mock('mongoose', () => {
  const mongoose = jest.requireActual('mongoose');
  return {
    ...mongoose,
    connect: jest.fn().mockResolvedValue(mongoose.connection),
    disconnect: jest.fn().mockResolvedValue(undefined),
    connection: { readyState: 1 },
  };
});

// Mock logger
jest.mock('../utils/logger', () => ({
  createModuleLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock config
jest.mock('../config', () => ({
  config: {
    port: 3000,
    nodeEnv: 'test',
    mongodbUri: 'mongodb://localhost:27017/test',
    platforms: {
      instagram: { enabled: true },
      facebook: { enabled: true },
      twitter: { enabled: true },
    },
  },
}));

jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

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
  return res;
};

export const createMockMessage = (overrides = {}) => ({
  _id: 'msg-123',
  conversationId: 'conv-123',
  platform: 'instagram',
  platformMessageId: 'ig-msg-123',
  sender: { type: 'user', platformUserId: 'user-123' },
  content: 'Hello! How can I help you?',
  mediaUrl: undefined,
  mediaType: undefined,
  timestamp: new Date(),
  read: false,
  metadata: {},
  ...overrides,
});

export const createMockConversation = (overrides = {}) => ({
  _id: 'conv-123',
  accountId: 'account-123',
  platform: 'instagram',
  platformConversationId: 'ig-conv-123',
  user: { platformUserId: 'user-123', username: 'testuser', displayName: 'Test User' },
  status: 'open',
  lastMessage: { content: 'Hello', sender: 'user', timestamp: new Date() },
  unreadCount: 0,
  tags: [],
  assignedTo: undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockQuickReply = (overrides = {}) => ({
  _id: 'qr-123',
  accountId: 'account-123',
  shortcut: '/hello',
  message: 'Hello! How can I assist you today?',
  category: 'greetings',
  isActive: true,
  usageCount: 10,
  ...overrides,
});

export const createMockSettings = (overrides = {}) => ({
  _id: 'settings-123',
  accountId: 'account-123',
  autoReply: true,
  businessHours: { start: '09:00', end: '18:00', timezone: 'Asia/Kolkata' },
  awayMessage: 'We are currently unavailable. Please leave a message.',
  notificationPreferences: { email: true, push: true },
  ...overrides,
});