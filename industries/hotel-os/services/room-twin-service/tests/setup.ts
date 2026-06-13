// Jest setup file
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// Mock environment variables
process.env.PORT = '8444';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/room-twin-test';
process.env.INTERNAL_SERVICE_TOKEN = 'test-token';
process.env.MQTT_BROKER_URL = 'mqtt://localhost:1883';

// Mock MQTT service
jest.mock('../src/services/iot-integration.service', () => {
  const EventEmitter = require('events');
  return {
    iotService: {
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      sendCommand: jest.fn().mockResolvedValue('cmd-123'),
      publishRoomStatus: jest.fn().mockResolvedValue(undefined),
      publishRoomEvent: jest.fn().mockResolvedValue(undefined),
      getConnectionStatus: jest.fn().mockReturnValue(true),
      on: jest.fn(),
      emit: jest.fn(),
    },
    IoTIntegrationService: class extends EventEmitter {
      connect = jest.fn().mockResolvedValue(undefined);
      disconnect = jest.fn();
      sendCommand = jest.fn().mockResolvedValue('cmd-123');
      publishRoomStatus = jest.fn().mockResolvedValue(undefined);
      publishRoomEvent = jest.fn().mockResolvedValue(undefined);
      getConnectionStatus = jest.fn().mockReturnValue(true);
    }
  };
});

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
