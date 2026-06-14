// Test setup file
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '4951';
process.env.MONGODB_URI = 'mongodb://localhost:27017/data_clean_room_test';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';
process.env.HOJAI_API_URL = 'http://localhost:4800';
process.env.CUSTOMER_GRAPH_URL = 'http://localhost:4808';
process.env.IDENTITY_CLOUD_URL = 'http://localhost:4996';
process.env.LOG_LEVEL = 'error';