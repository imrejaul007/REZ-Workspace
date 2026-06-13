// Test setup file
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

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
    updateOrderStatus: jest.fn().mockResolvedValue(undefined),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../src/utils/rez-kds-client', () => ({
  rezKDSClient: {
    routeOrder: jest.fn().mockResolvedValue(undefined),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../src/utils/rez-inventory-client', () => ({
  rezInventoryClient: {
    deductForOrder: jest.fn().mockResolvedValue(undefined),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
});