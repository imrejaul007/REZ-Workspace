import logger from './utils/logger';

const { execSync } = require('child_process');
const dotenv = require('dotenv');

module.exports = async function globalSetup() {
  // Load test environment variables
  dotenv.config({ path: '.env.test' });

  logger.info('🚀 Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MOCK_DATABASE = 'true';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

  // Check if we should use mock database
  const useMockDatabase = process.env.MOCK_DATABASE === 'true';

  if (useMockDatabase) {
    logger.info('🔧 Using mock database for testing');
    logger.info('✅ Test environment setup complete (mock mode)');
    return;
  }

  // Real database setup (if needed)
  const testDatabaseUrl = process.env.DATABASE_URL_TEST ||
    'postgresql://test:test@localhost:5432/restopapa_test?schema=public';

  process.env.DATABASE_URL = testDatabaseUrl;

  try {
    // Reset test database
    logger.info('📁 Resetting test database...');
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    });

    // Apply migrations
    logger.info('🔄 Applying database migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    });

    // Generate Prisma client
    logger.info('⚡ Generating Prisma client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });

    logger.info('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    if (!useMockDatabase) {
      logger.info('💡 Consider setting MOCK_DATABASE=true for testing without real database');
    }
    process.exit(1);
  }
};