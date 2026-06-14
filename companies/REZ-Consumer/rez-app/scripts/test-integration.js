import logger from './utils/logger';

#!/usr/bin/env node

// Integration test script to verify frontend-backend connectivity
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function testBackendEndpoints() {
  logger.info('🔍 Testing Backend API Endpoints...\n');

  const endpoints = [
    { name: 'Categories', url: '/categories', requiresAuth: false },
    { name: 'Products', url: '/products', requiresAuth: false },
    { name: 'Stores', url: '/stores', requiresAuth: false },
    { name: 'Auth (Send OTP)', url: '/auth/send-otp', requiresAuth: false, method: 'POST', data: { phoneNumber: '+1234567890' } },
    { name: 'Wishlist', url: '/wishlist', requiresAuth: true },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      logger.info(`Testing ${endpoint.name}...`);
      
      const config = {
        method: endpoint.method || 'GET',
        url: `${API_BASE_URL}${endpoint.url}`,
        timeout: 5000,
        ...(endpoint.data && { data: endpoint.data })
      };

      const response = await axios(config);
      
      if (response.data) {
        results.push({
          endpoint: endpoint.name,
          status: '✅ SUCCESS',
          data: Array.isArray(response.data.data) ? `${response.data.data.length} items` : 'Data returned',
          message: response.data.message || 'OK'
        });
      }
    } catch (error) {
      let status = '❌ FAILED';
      let message = error.message;
      
      if (error.response) {
        const status_code = error.response.status;
        if (endpoint.requiresAuth && status_code === 401) {
          status = '🔐 AUTH_REQUIRED';
          message = 'Authentication required (expected)';
        } else if (status_code === 404) {
          status = '📭 NOT_FOUND';
          message = 'Endpoint not found';
        } else if (status_code === 429) {
          status = '⚠️ RATE_LIMITED';
          message = 'Too many requests';
        }
      }
      
      results.push({
        endpoint: endpoint.name,
        status,
        data: 'N/A',
        message
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info('\n📊 Integration Test Results:');
  console.log('=' .repeat(60));
  results.forEach(result => {
    logger.info(`${result.endpoint.padEnd(20)} ${result.status.padEnd(15)} ${result.message}`);
  });

  const successCount = results.filter(r => r.status.includes('SUCCESS')).length;
  const authRequiredCount = results.filter(r => r.status.includes('AUTH_REQUIRED')).length;
  const totalWorking = successCount + authRequiredCount;

  logger.info('\n📈 Summary:');
  logger.info(`Total Endpoints: ${results.length}`);
  logger.info(`Working: ${totalWorking} (${successCount} public + ${authRequiredCount} protected)`);
  logger.info(`Failed: ${results.length - totalWorking}`);
  
  if (totalWorking === results.length) {
    logger.info('\n🎉 All endpoints are responding correctly!');
    return true;
  } else {
    logger.info('\n⚠️ Some endpoints need attention.');
    return false;
  }
}

async function testMongoDbData() {
  logger.info('\n🗄️ Testing MongoDB Data...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    const categories = response.data.data;
    
    logger.info(`Found ${categories.length} categories in MongoDB:`);
    categories.forEach(cat => {
      logger.info(`  - ${cat.name} (${cat.slug}) - ${cat.productCount || 0} products`);
    });
    
    const productsResponse = await axios.get(`${API_BASE_URL}/products`);
    const products = productsResponse.data.data;
    
    logger.info(`\nFound ${products.length} products in MongoDB:`);
    products.slice(0, 3).forEach(prod => {
      logger.info(`  - ${prod.name} - ₹${prod.pricing.selling}`);
    });
    
    return true;
  } catch (error) {
    console.log('❌ Failed to retrieve MongoDB data:', error.message);
    return false;
  }
}

async function main() {
  logger.info('🚀 Starting REZ App Integration Tests\n');
  
  try {
    const backendTest = await testBackendEndpoints();
    const dataTest = await testMongoDbData();
    
    logger.info('\n' + '='.repeat(60));
    if (backendTest && dataTest) {
      logger.info('🎯 Integration Test: PASSED');
      logger.info('✅ Frontend can successfully connect to backend');
      logger.info('✅ MongoDB contains seeded data');
      logger.info('✅ API endpoints are functioning');
      process.exit(0);
    } else {
      logger.info('❌ Integration Test: FAILED');
      logger.info('⚠️ There are issues that need to be resolved');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { testBackendEndpoints, testMongoDbData };