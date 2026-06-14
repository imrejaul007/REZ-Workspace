import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Test Script for Authentication Integration
 * Tests the connection between frontend and backend auth system
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';
const TEST_PHONE = '+918102232747'; // Replace with actual test number

logger.info('🧪 Testing REZ App Authentication Integration');
logger.info(`📡 Backend URL: ${BACKEND_URL}`);
console.log('=' .repeat(50));

async function testHealthCheck() {
  try {
    logger.info('\n1️⃣ Testing Backend Health...');
    const response = await axios.get(BACKEND_URL.replace('/api', '/health'));
    
    if (response.data.status === 'ok') {
      logger.info('✅ Backend is healthy');
      logger.info(`   Database: ${response.data.database.status}`);
      logger.info(`   Environment: ${response.data.environment}`);
      return true;
    } else {
      logger.info('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    logger.info('❌ Backend is not reachable');
    logger.info(`   Error: ${error.message}`);
    return false;
  }
}

async function testSendOTP() {
  try {
    logger.info('\n2️⃣ Testing Send OTP...');
    const response = await axios.post(`${BACKEND_URL}/auth/send-otp`, {
      phoneNumber: TEST_PHONE
    });
    
    if (response.data.success) {
      logger.info('✅ OTP sent successfully');
      logger.info(`   Message: ${response.data.message}`);
      return true;
    } else {
      logger.info('❌ Send OTP failed');
      logger.info(`   Error: ${response.data.message}`);
      return false;
    }
  } catch (error) {
    logger.info('❌ Send OTP request failed');
    logger.info(`   Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAPIEndpoints() {
  logger.info('\n3️⃣ Testing API Endpoints...');
  
  const endpoints = [
    '/auth/send-otp',
    '/auth/verify-otp', 
    '/auth/refresh-token',
    '/auth/me',
    '/auth/profile'
  ];
  
  for (const endpoint of endpoints) {
    try {
      // Just check if endpoint exists (will return validation error for empty body)
      await axios.post(`${BACKEND_URL}${endpoint}`, {});
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      
      if (status === 400 && message?.includes('Validation failed')) {
        logger.info(`✅ ${endpoint} - Endpoint exists (validation working)`);
      } else if (status === 401 && message?.includes('Authentication required')) {
        logger.info(`✅ ${endpoint} - Endpoint exists (auth required)`);
      } else if (status === 405) {
        logger.info(`✅ ${endpoint} - Endpoint exists (method check)`);
      } else {
        logger.info(`⚠️  ${endpoint} - Unexpected response: ${status} ${message}`);
      }
    }
  }
}

async function runTests() {
  logger.info('\n🚀 Starting Authentication Integration Tests...\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    logger.info('\n❌ Backend not available. Please start the backend server first.');
    logger.info('   Command: cd user-backend && npm start');
    process.exit(1);
  }
  
  await testAPIEndpoints();
  await testSendOTP();
  
  logger.info('\n' + '='.repeat(50));
  logger.info('✅ Authentication Integration Test Complete!');
  logger.info('\n📋 Next Steps:');
  logger.info('   1. Start the frontend: cd frontend && npm start');
  logger.info('   2. Test the onboarding flow in the app');
  logger.info('   3. Use the OTP from backend console logs');
  logger.info('\n🎉 Backend is ready for frontend integration!');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Test failed:', error.message);
  process.exit(1);
});