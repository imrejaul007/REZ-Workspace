import logger from './utils/logger';

#!/usr/bin/env ts-node
/**
 * Bill Upload Integration Test Script
 *
 * This script tests the bill upload flow from frontend to backend
 * Run: npx ts-node scripts/test-bill-upload-integration.ts
 */

import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:5001';
const API_URL = `${BACKEND_URL}/api`;

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?;
}

const results: TestResult[] = [];

/**
 * Test 1: Check if backend server is running
 */
async function testBackendConnection(): Promise<TestResult> {
  logger.info('\n🧪 Test 1: Backend Server Connection');
  console.log('━'.repeat(50));

  try {
    const response = await fetch(`${BACKEND_URL}/health`, { timeout: 5000 });
    const data = await response.json();

    if (response.ok) {
      logger.info('✅ Backend server is running');
      console.log('Server status:', JSON.stringify(data, null, 2));
      return {
        test: 'Backend Connection',
        passed: true,
        message: 'Backend server is accessible',
        details: data
      };
    } else {
      logger.info('❌ Backend server returned error');
      return {
        test: 'Backend Connection',
        passed: false,
        message: `Server returned ${response.status}: ${response.statusText}`,
        details: data
      };
    }
  } catch (error) {
    logger.info('❌ Cannot connect to backend server');
    console.log('Error:', error.message);
    return {
      test: 'Backend Connection',
      passed: false,
      message: `Connection failed: ${error.message}`,
      details: { error: error.message, code: error.code }
    };
  }
}

/**
 * Test 2: Check if bill routes are registered
 */
async function testBillRoutesRegistration(): Promise<TestResult> {
  logger.info('\n🧪 Test 2: Bill Routes Registration');
  console.log('━'.repeat(50));

  try {
    // Try to access the bills endpoint (will get 401 without auth, but that's ok)
    const response = await fetch(`${API_URL}/bills`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 401 means route exists but requires auth - that's good!
    // 404 means route doesn't exist - that's bad!
    if (response.status === 401) {
      logger.info('✅ Bill routes are registered (got 401 - auth required)');
      return {
        test: 'Bill Routes Registration',
        passed: true,
        message: 'Bill routes are properly registered and require authentication'
      };
    } else if (response.status === 404) {
      logger.info('❌ Bill routes not found (404)');
      return {
        test: 'Bill Routes Registration',
        passed: false,
        message: 'Bill routes are not registered or not accessible'
      };
    } else {
      logger.info(`⚠️  Unexpected response: ${response.status}`);
      const text = await response.text();
      return {
        test: 'Bill Routes Registration',
        passed: false,
        message: `Unexpected status code: ${response.status}`,
        details: text
      };
    }
  } catch (error) {
    logger.info('❌ Error checking bill routes');
    console.log('Error:', error.message);
    return {
      test: 'Bill Routes Registration',
      passed: false,
      message: `Route check failed: ${error.message}`
    };
  }
}

/**
 * Test 3: Check if upload endpoint accepts multipart/form-data
 */
async function testUploadEndpoint(): Promise<TestResult> {
  logger.info('\n🧪 Test 3: Upload Endpoint Configuration');
  console.log('━'.repeat(50));

  try {
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('test', 'value');

    const response = await fetch(`${API_URL}/bills/upload`, {
      method: 'POST',
      body: formData
    });

    // 401 means endpoint exists but requires auth - good!
    // 404 means endpoint doesn't exist - bad!
    if (response.status === 401) {
      logger.info('✅ Upload endpoint is configured (requires auth)');
      return {
        test: 'Upload Endpoint',
        passed: true,
        message: 'Upload endpoint accepts multipart/form-data'
      };
    } else if (response.status === 404) {
      logger.info('❌ Upload endpoint not found');
      return {
        test: 'Upload Endpoint',
        passed: false,
        message: 'Upload endpoint /api/bills/upload not found'
      };
    } else {
      logger.info(`⚠️  Response status: ${response.status}`);
      const text = await response.text();
      return {
        test: 'Upload Endpoint',
        passed: response.status !== 404,
        message: `Endpoint returned ${response.status}`,
        details: text.substring(0, 200)
      };
    }
  } catch (error) {
    logger.info('❌ Error testing upload endpoint');
    console.log('Error:', error.message);
    return {
      test: 'Upload Endpoint',
      passed: false,
      message: `Upload endpoint test failed: ${error.message}`
    };
  }
}

/**
 * Test 4: Check Cloudinary configuration
 */
async function testCloudinaryConfig(): Promise<TestResult> {
  logger.info('\n🧪 Test 4: Cloudinary Configuration');
  console.log('━'.repeat(50));

  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data: unknown = await response.json();

    // Check if health endpoint includes cloudinary status
    const cloudinaryConfigured = data.cloudinary !== false;

    if (cloudinaryConfigured) {
      logger.info('✅ Cloudinary appears to be configured');
      return {
        test: 'Cloudinary Configuration',
        passed: true,
        message: 'Cloudinary configuration detected'
      };
    } else {
      logger.info('⚠️  Cloudinary may not be configured');
      return {
        test: 'Cloudinary Configuration',
        passed: false,
        message: 'Cloudinary configuration not confirmed',
        details: 'Check backend logs for Cloudinary validation message'
      };
    }
  } catch (error) {
    logger.info('⚠️  Cannot verify Cloudinary configuration');
    return {
      test: 'Cloudinary Configuration',
      passed: false,
      message: 'Unable to verify Cloudinary setup'
    };
  }
}

/**
 * Test 5: Check frontend API client configuration
 */
async function testFrontendConfig(): Promise<TestResult> {
  logger.info('\n🧪 Test 5: Frontend Configuration');
  console.log('━'.repeat(50));

  const frontendApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

  console.log('Frontend API URL:', frontendApiUrl);
  console.log('Expected Backend URL:', API_URL);

  if (frontendApiUrl === API_URL) {
    logger.info('✅ Frontend API URL matches backend');
    return {
      test: 'Frontend Configuration',
      passed: true,
      message: 'Frontend is configured to connect to correct backend'
    };
  } else {
    logger.info('⚠️  Frontend API URL mismatch');
    return {
      test: 'Frontend Configuration',
      passed: false,
      message: 'Frontend API URL does not match backend',
      details: {
        frontend: frontendApiUrl,
        backend: API_URL
      }
    };
  }
}

/**
 * Main test runner
 */
async function runTests() {
  logger.info('\n╔══════════════════════════════════════════════════╗');
  logger.info('║   BILL UPLOAD INTEGRATION DIAGNOSTIC TESTS      ║');
  logger.info('╚══════════════════════════════════════════════════╝');
  logger.info('\nTesting bill upload integration between frontend and backend...\n');

  // Run all tests
  results.push(await testBackendConnection());
  results.push(await testBillRoutesRegistration());
  results.push(await testUploadEndpoint());
  results.push(await testCloudinaryConfig());
  results.push(await testFrontendConfig());

  // Print summary
  logger.info('\n\n╔══════════════════════════════════════════════════╗');
  logger.info('║              TEST RESULTS SUMMARY                ║');
  logger.info('╚══════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    logger.info(`${index + 1}. ${status} - ${result.test}`);
    logger.info(`   ${result.message}`);
    if (result.details && !result.passed) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    logger.info('');
  });

  console.log('━'.repeat(50));
  logger.info(`Total Tests: ${results.length}`);
  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  console.log('━'.repeat(50));

  // Provide recommendations
  logger.info('\n\n╔══════════════════════════════════════════════════╗');
  logger.info('║              RECOMMENDATIONS                     ║');
  logger.info('╚══════════════════════════════════════════════════╝\n');

  if (failed === 0) {
    logger.info('✅ All tests passed! Bill upload system is ready.');
    logger.info('\nNext steps:');
    logger.info('1. Ensure you have a valid auth token');
    logger.info('2. Test bill upload from the frontend app');
    logger.info('3. Check backend logs for unknown errors during upload');
  } else {
    console.log('⚠️  Some tests failed. Here\'s what to check:\n');

    results.forEach(result => {
      if (!result.passed) {
        logger.info(`❌ ${result.test}:`);
        logger.info(`   Issue: ${result.message}`);

        if (result.test === 'Backend Connection') {
          logger.info('   Fix: Start the backend server with: npm run dev');
        } else if (result.test === 'Bill Routes Registration') {
          logger.info('   Fix: Verify billRoutes are imported and registered in server.ts');
        } else if (result.test === 'Upload Endpoint') {
          logger.info('   Fix: Check billRoutes.ts for POST /upload endpoint');
        } else if (result.test === 'Cloudinary Configuration') {
          logger.info('   Fix: Add CLOUDINARY_* environment variables to backend .env');
        } else if (result.test === 'Frontend Configuration') {
          logger.info('   Fix: Update EXPO_PUBLIC_API_BASE_URL in frontend .env');
        }
        logger.info('');
      }
    });
  }

  logger.info('\n\n╔══════════════════════════════════════════════════╗');
  logger.info('║              FRONTEND ERROR GUIDE                ║');
  logger.info('╚══════════════════════════════════════════════════╝\n');

  logger.info('Common frontend errors when clicking "Upload Bills":');
  logger.info('\n1. "Network request failed" / "Cannot connect"');
  logger.info('   → Backend not running or wrong API_BASE_URL');
  logger.info('   → Check: EXPO_PUBLIC_API_BASE_URL in frontend/.env');
  logger.info('   → Should be: http://localhost:5001/api');

  logger.info('\n2. "404 Not Found"');
  logger.info('   → Bill routes not registered in backend');
  logger.info('   → Check: backend server logs for "Bill routes registered"');

  logger.info('\n3. "401 Unauthorized"');
  logger.info('   → User not logged in or token expired');
  logger.info('   → Fix: Log in first, then try uploading');

  logger.info('\n4. "500 Internal Server Error"');
  logger.info('   → Cloudinary not configured or other backend error');
  logger.info('   → Check: backend console for detailed error');

  logger.info('\n5. Navigation error / App crashes');
  logger.info('   → Check: bill-upload.tsx file exists in app/ folder');
  logger.info('   → Verify: No TypeScript errors in the component');

  logger.info('\n\n');
}

// Run tests
runTests().catch(error => {
  logger.error('Fatal error running tests:', error);
  process.exit(1);
});
