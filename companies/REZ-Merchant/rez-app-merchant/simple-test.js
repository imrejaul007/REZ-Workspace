import logger from './utils/logger';

// Simple API endpoint test
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5001';

function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    logger.info(`Testing: ${url}`);
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const status = res.statusCode;
        logger.info(`  Status: ${status}`);
        if (status === 200) {
          logger.info(`  ✅ PASS\n`);
          resolve(true);
        } else if (status === 401) {
          logger.info(`  ⚠️  REQUIRES AUTH (endpoint exists)\n`);
          resolve(true);
        } else {
          logger.info(`  ❌ FAIL\n`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      logger.info(`  ❌ ERROR: ${err.message}\n`);
      resolve(false);
    });
  });
}

async function runTests() {
  logger.info('\n🧪 API Endpoint Tests\n');
  console.log('='.repeat(50));
  logger.info('');
  
  const endpoints = [
    '/health',
    '/api/merchant/sync/status',
    '/api/merchant/sync/history',
    '/api/merchant/sync/health',
    '/api/merchant/profile/customer-view',
    '/api/merchant/profile/visibility',
    '/api/merchant/bulk/products/template?format=csv'
  ];
  
  let passed = 0;
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result) passed++;
  }
  
  console.log('='.repeat(50));
  logger.info(`\n📊 Results: ${passed}/${endpoints.length} endpoints accessible\n`);
}

runTests();
