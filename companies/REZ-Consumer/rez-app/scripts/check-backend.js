import logger from './utils/logger';

/**
 * Backend Connectivity Check Script
 * This script verifies if the backend server is running and accessible
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';
const BACKEND_URL = API_BASE_URL.replace('/api', '');

async function checkBackendHealth() {
  logger.info('\n========================================');
  logger.info('🔍 Checking Backend Server Status');
  logger.info('========================================\n');
  logger.info(`Backend URL: ${BACKEND_URL}`);
  logger.info(`API URL: ${API_BASE_URL}`);
  logger.info('\n----------------------------------------\n');

  // Check main server health
  try {
    logger.info('📡 Checking server health endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    if (healthResponse.ok) {
      const data = await healthResponse.json();
      logger.info('✅ Server is healthy!');
      console.log('   Response:', JSON.stringify(data, null, 2));
    } else {
      logger.info(`⚠️  Server responded with status: ${healthResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    logger.info('\n⚠️  Backend server appears to be down or unreachable.');
    logger.info('\nTo start the backend server:');
    logger.info('1. Navigate to the backend directory:');
    logger.info('   cd "C:\\Users\\Mukul raj\\Downloads\\rez-new\\rez-app\\user-backend"');
    logger.info('2. Install dependencies (if not already done):');
    logger.info('   npm install');
    logger.info('3. Start the server:');
    logger.info('   npm run dev');
    process.exit(1);
  }

  // Check API endpoints
  const endpoints = [
    { path: '/categories', name: 'Categories' },
    { path: '/products', name: 'Products' },
    { path: '/stores', name: 'Stores' }
  ];

  logger.info('\n📋 Checking API endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        logger.info(`✅ ${endpoint.name} endpoint is accessible`);
      } else {
        logger.info(`⚠️  ${endpoint.name} endpoint returned status: ${response.status}`);
      }
    } catch (error) {
      logger.error(❌ ${endpoint.name} endpoint failed:`, error.message);
    }
  }

  logger.info('\n========================================');
  logger.info('✅ Backend connectivity check complete!');
  logger.info('========================================\n');
}

// Run the check
checkBackendHealth().catch(error => {
  console.error('\n❌ Fatal error during backend check:', error);
  process.exit(1);
});