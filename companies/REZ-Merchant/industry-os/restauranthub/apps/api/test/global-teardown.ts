import logger from './utils/logger';

module.exports = async function globalTeardown() {
  logger.info('🧹 Cleaning up test environment...');

  // Check if we're using mock database
  const useMockDatabase = process.env.MOCK_DATABASE === 'true';

  if (useMockDatabase) {
    logger.info('✅ Test environment cleanup complete (mock mode)');
    return;
  }

  // Real database cleanup
  const { PrismaClient } = require('@prisma/client');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_TEST ||
          'postgresql://test:test@localhost:5432/restopapa_test?schema=public',
      },
    },
  });

  try {
    // Clean up test database
    await prisma.$executeRaw`DROP SCHEMA IF EXISTS public CASCADE`;
    await prisma.$executeRaw`CREATE SCHEMA public`;

    logger.info('✅ Test environment cleanup complete');
  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
};