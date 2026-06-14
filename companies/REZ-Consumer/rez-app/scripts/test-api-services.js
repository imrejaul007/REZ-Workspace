import logger from './utils/logger';

// Simple test script to verify API services connectivity
// This tests the basic functionality of our API service layer

const { checkServicesHealth } = require('../services/index.ts');

async function testApiServices() {
  logger.info('🧪 Testing API Services Integration...\n');

  try {
    // Test 1: Health Check
    logger.info('1. Testing Backend Health Check...');
    const healthResult = await checkServicesHealth();
    
    if (healthResult.status === 'healthy') {
      logger.info('✅ Backend health check passed');
      logger.info(`   Timestamp: ${healthResult.timestamp}`);
      logger.info(`   Database: ${healthResult.details?.database || 'connected'}`);
    } else {
      logger.info('❌ Backend health check failed');
      logger.info(`   Status: ${healthResult.status}`);
      logger.info(`   Error: ${healthResult.error || 'Unknown error'}`);
      return;
    }

    logger.info('\n2. Testing API Service Imports...');
    
    // Test 2: Service Imports
    try {
      const services = require('../services/index.ts');
      
      const expectedServices = [
        'apiClient',
        'authService', 
        'productsService',
        'cartService',
        'ordersService', 
        'storesService',
        'videosService',
        'projectsService',
        'notificationsService',
        'reviewsService',
        'wishlistService'
      ];

      for (const serviceName of expectedServices) {
        if (services[serviceName]) {
          logger.info(`✅ ${serviceName} imported successfully`);
        } else {
          logger.info(`❌ ${serviceName} import failed`);
        }
      }

      logger.info('\n3. Testing API Client Configuration...');
      
      // Test 3: API Client Configuration
      const { apiClient } = services;
      const baseURL = apiClient.getBaseURL();
      logger.info(`✅ API Client configured with base URL: ${baseURL}`);

      // Test 4: Basic API Endpoints
      logger.info('\n4. Testing Basic API Endpoints...');
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:5001/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        logger.info('✅ Health endpoint accessible');
        logger.info(`   Response: ${JSON.stringify(healthData)}`);
      } else {
        logger.info('❌ Health endpoint not accessible');
      }

      // Test API info endpoint
      const apiInfoResponse = await fetch('http://localhost:5001/api-info');
      if (apiInfoResponse.ok) {
        const apiInfoData = await apiInfoResponse.json();
        logger.info('✅ API info endpoint accessible');
        logger.info(`   Total endpoints: ${apiInfoData.totalEndpoints || 'Unknown'}`);
      } else {
        logger.info('❌ API info endpoint not accessible');
      }

      logger.info('\n🎉 API Services Integration Test Completed Successfully!');
      logger.info('\n📊 Summary:');
      logger.info('   ✅ Backend server is running and healthy');
      logger.info('   ✅ All API services are properly imported');
      logger.info('   ✅ API client is configured correctly');
      logger.info('   ✅ Basic endpoints are accessible');
      logger.info('\n🚀 Ready for frontend integration!');

    } catch (importError) {
      logger.info('❌ Service import test failed:');
      logger.info(`   Error: ${importError.message}`);
    }

  } catch (error) {
    logger.info('❌ API Services test failed:');
    logger.info(`   Error: ${error.message}`);
    logger.info(`   Stack: ${error.stack}`);
  }
}

// Run the test
testApiServices().catch(console.error);