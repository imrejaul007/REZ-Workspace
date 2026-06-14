import logger from './utils/logger';

// Simple test script to verify backend connectivity
// Tests if backend endpoints are accessible

const fetch = require('node-fetch');

async function testBackendConnectivity() {
  logger.info('🧪 Testing Backend Connectivity...\n');

  const baseURL = 'http://localhost:5001';
  
  const endpoints = [
    { path: '/health', description: 'Health Check' },
    { path: '/api-info', description: 'API Information' },
    { path: '/api/auth/profile', description: 'Auth Profile (should fail without token)', expectAuth: true },
    { path: '/api/products', description: 'Products List' },
    { path: '/api/stores', description: 'Stores List' },
    { path: '/api/categories', description: 'Categories List' }
  ];

  let passCount = 0;
  let totalTests = endpoints.length;

  for (const endpoint of endpoints) {
    try {
      logger.info(`Testing ${endpoint.description}...`);
      
      const response = await fetch(`${baseURL}${endpoint.path}`, {
        timeout: 5000
      });

      if (endpoint.expectAuth && response.status === 401) {
        logger.info(`✅ ${endpoint.description} - Expected 401 (auth required)`);
        passCount++;
      } else if (!endpoint.expectAuth && response.ok) {
        const data = await response.json();
        logger.info(`✅ ${endpoint.description} - Response received`);
        if (endpoint.path === '/health') {
          logger.info(`   Status: ${data.status}`);
          logger.info(`   Database: ${data.database}`);
        } else if (endpoint.path === '/api-info') {
          logger.info(`   Total Endpoints: ${data.totalEndpoints || 'Unknown'}`);
        }
        passCount++;
      } else {
        logger.info(`❌ ${endpoint.description} - Status: ${response.status}`);
      }
    } catch (error) {
      logger.info(`❌ ${endpoint.description} - Error: ${error.message}`);
    }
    
    logger.info(''); // Add spacing
  }

  logger.info('📊 Test Results:');
  logger.info(`   Passed: ${passCount}/${totalTests}`);
  logger.info(`   Success Rate: ${((passCount/totalTests) * 100).toFixed(1)}%`);

  if (passCount === totalTests) {
    logger.info('\n🎉 All backend connectivity tests passed!');
    logger.info('✅ Backend is ready for frontend integration');
  } else {
    logger.info('\n⚠️  Some tests failed. Check backend server status.');
  }
}

// Check if node-fetch is available, if not provide fallback
async function testWithFallback() {
  try {
    await testBackendConnectivity();
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.info('node-fetch not available, using basic connectivity test...\n');
      
      // Fallback test using curl
      const { spawn } = require('child_process');

      const curlTest = spawn('curl', ['-s', 'http://localhost:5001/health']);
      
      curlTest.stdout.on('data', (data) => {
        logger.info('✅ Backend is responding');
        logger.info(`Response: ${data}`);
      });
      
      curlTest.on('error', (err) => {
        logger.info('❌ Backend connectivity test failed');
        logger.info(`Error: ${err.message}`);
      });
    } else {
      throw error;
    }
  }
}

testWithFallback().catch(console.error);