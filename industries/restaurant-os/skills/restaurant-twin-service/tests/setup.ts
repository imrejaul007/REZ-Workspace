// Test setup file
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock external services
jest.mock('../src/utils/message-broker', () => ({
  messageBroker: {
    connect: jest.fn().mockResolvedValue(undefined),
    publish: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    isConnected: jest.fn().mockReturnValue(true)
  }
}));

jest.mock('../src/utils/rez-pos-client', () => ({
  rezPOSClient: {
    syncRestaurant: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn().mockResolvedValue({
      currentCovers: 0,
      pendingOrders: 0,
      revenueToday: 0,
      ordersToday: 0
    }),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../src/utils/rez-dashboard-client', () => ({
  rezDashboardClient: {
    notifyStatusChange: jest.fn().mockResolvedValue(undefined),
    pushMetrics: jest.fn().mockResolvedValue(undefined),
    pushAlert: jest.fn().mockResolvedValue(undefined),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

// Set test timeout
jest.setTimeout(10000);

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
