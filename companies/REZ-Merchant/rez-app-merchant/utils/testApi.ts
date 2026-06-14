import logger from './utils/logger';

// Quick API test utility
import { getApiUrl } from '@/config/api';
import { storageService } from '@/services/storage';

export const testApi = {
  async testProductsEndpoint() {
    logger.info('🧪 Testing products endpoint...');

    try {
      // Get token
      const token = await storageService.getAuthToken();
      console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'null');

      if (!token) {
        logger.info('❌ No token available');
        return { error: 'No token' };
      }

      // Test products list endpoint
      const url = getApiUrl('merchant/products');
      console.log('🌐 Testing URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers));

      const responseText = await response.text();
      console.log('📡 Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('📡 Parsed response:', data);
      } catch (e) {
        console.error('❌ Failed to parse response as JSON:', e);
        return { error: 'Invalid JSON response', responseText };
      }

      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: Object.fromEntries(response.headers),
      };
    } catch (error) {
      console.error('❌ Test failed:', error);
      return { error: error.message };
    }
  },

  async testCreateSampleProduct() {
    logger.info('🧪 Creating sample product...');

    try {
      const token = await storageService.getAuthToken();
      if (!token) {
        logger.info('❌ No token available');
        return { error: 'No token' };
      }

      const sampleProduct = {
        name: 'Test Product',
        description: 'This is a test product created via API',
        price: 99.99,
        category: 'Electronics',
        sku: 'TEST-001',
        inventory: {
          stock: 10,
          lowStockThreshold: 2,
          trackInventory: true,
          allowBackorders: false,
        },
        cashback: {
          percentage: 5,
          maxAmount: 50,
          isActive: true,
        },
        status: 'active',
        visibility: 'public',
      };

      const url = getApiUrl('merchant/products');
      console.log('🌐 Creating product at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleProduct),
      });

      console.log('📡 Create response status:', response.status);
      const responseText = await response.text();
      console.log('📡 Create response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        return { error: 'Invalid JSON response', responseText };
      }

      return {
        status: response.status,
        ok: response.ok,
        data,
      };
    } catch (error) {
      console.error('❌ Create sample product failed:', error);
      return { error: error.message };
    }
  },
};

// Make it available globally for debugging
if (__DEV__) {
  (global as unknown).testApi = testApi;
  logger.info('🔧 Test API utilities available as global.testApi');
}
