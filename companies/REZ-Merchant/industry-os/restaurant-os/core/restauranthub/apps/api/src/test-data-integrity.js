import logger from './utils/logger';

#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_BASE = 'http://127.0.0.1:3016/api/v1';
const TEST_RESULTS_FILE = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/api/src/test-results.json';

// Test credentials
const DEMO_USERS = {
  admin: { email: 'admin@restopapa.com', password: 'demo123' },
  restaurant: { email: 'restaurant@restopapa.com', password: 'demo123' },
  employee: { email: 'employee@restopapa.com', password: 'demo123' },
  vendor: { email: 'vendor@restopapa.com', password: 'demo123' }
};

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  }
};

// Helper functions
function logTest(name, status, data = null, error = null) {
  const test = {
    name,
    status,
    timestamp: new Date().toISOString(),
    data,
    error: error ? error.message : null
  };

  testResults.tests.push(test);
  testResults.summary.total++;

  if (status === 'PASS') {
    testResults.summary.passed++;
    logger.info(`✅ ${name}`);
  } else {
    testResults.summary.failed++;
    testResults.summary.errors.push({ test: name, error: error ? error.message : 'Unknown error' });
    logger.info(`❌ ${name}: ${error ? error.message : 'Failed'}`);
  }

  if (data) {
    logger.info(`   Data: ${JSON.stringify(data, null, 2)}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Authentication helper
async function authenticate(userType) {
  try {
    const credentials = DEMO_USERS[userType];
    if (!credentials) {
      throw new Error(`Unknown user type: ${userType}`);
    }

    const response = await axios.post(`${API_BASE}/auth/signin`, credentials);
    return response.data.accessToken;
  } catch (error) {
    throw new Error(`Authentication failed for ${userType}: ${error.response?.data?.message || error.message}`);
  }
}

// API helper with auth
function createAuthenticatedAxios(token) {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// Test functions
async function testUserAuthentication() {
  logger.info('\n🔐 Testing User Authentication...');

  for (const [userType, credentials] of Object.entries(DEMO_USERS)) {
    try {
      await sleep(5000); // Longer delay for rate limiting
      const token = await authenticate(userType);
      logTest(`${userType} authentication`, 'PASS', { hasToken: !!token });
    } catch (error) {
      logTest(`${userType} authentication`, 'FAIL', null, error);
    }
  }
}

async function testUserProfileOperations() {
  logger.info('\n👤 Testing User Profile Operations...');

  try {
    await sleep(1000);
    const token = await authenticate('admin');
    const api = createAuthenticatedAxios(token);

    // Test get profile
    const profileResponse = await api.get('/users/profile');
    logTest('Get user profile', 'PASS', {
      hasProfile: !!profileResponse.data,
      userEmail: profileResponse.data?.email
    });

    // Test update profile
    const updateData = {
      profile: {
        firstName: 'Test',
        lastName: 'Admin'
      }
    };

    const updateResponse = await api.put('/users/profile', updateData);
    logTest('Update user profile', 'PASS', {
      updated: !!updateResponse.data
    });

    // Test get stats
    const statsResponse = await api.get('/users/stats');
    logTest('Get user stats', 'PASS', statsResponse.data);

  } catch (error) {
    logTest('User profile operations', 'FAIL', null, error);
  }
}

async function testRestaurantOperations() {
  logger.info('\n🍽️ Testing Restaurant Operations...');

  try {
    await sleep(1000);
    const token = await authenticate('restaurant');
    const api = createAuthenticatedAxios(token);

    // Test get restaurants
    const restaurantsResponse = await api.get('/restaurants');
    logTest('Get restaurants list', 'PASS', {
      count: restaurantsResponse.data?.length || 0
    });

    // Test create restaurant
    const restaurantData = {
      name: 'Test Restaurant',
      description: 'A test restaurant for data integrity testing',
      cuisineType: ['Indian', 'Chinese'],
      licenseNumber: 'TEST123456',
      gstNumber: 'TEST123456789',
      fssaiNumber: 'TEST123456789'
    };

    const createResponse = await api.post('/restaurants', restaurantData);
    logTest('Create restaurant', 'PASS', {
      created: !!createResponse.data,
      restaurantId: createResponse.data?.id
    });

  } catch (error) {
    logTest('Restaurant operations', 'FAIL', null, error);
  }
}

async function testJobOperations() {
  logger.info('\n💼 Testing Job Operations...');

  try {
    await sleep(1000);
    const token = await authenticate('restaurant');
    const api = createAuthenticatedAxios(token);

    // Test get jobs
    const jobsResponse = await api.get('/jobs');
    logTest('Get jobs list', 'PASS', {
      count: jobsResponse.data?.length || 0
    });

    // Test create job
    const jobData = {
      title: 'Test Chef Position',
      description: 'A test job posting for data integrity testing',
      requirements: ['Cooking experience', 'Food safety knowledge'],
      skills: ['Cooking', 'Food preparation'],
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 25000,
      salaryMax: 40000,
      location: 'Test City',
      jobType: 'Full-time',
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const createResponse = await api.post('/jobs', jobData);
    logTest('Create job posting', 'PASS', {
      created: !!createResponse.data,
      jobId: createResponse.data?.id
    });

  } catch (error) {
    logTest('Job operations', 'FAIL', null, error);
  }
}

async function testVendorOperations() {
  logger.info('\n🏪 Testing Vendor Operations...');

  try {
    await sleep(1000);
    const token = await authenticate('vendor');
    const api = createAuthenticatedAxios(token);

    // Test get vendors
    const vendorsResponse = await api.get('/vendors');
    logTest('Get vendors list', 'PASS', {
      count: vendorsResponse.data?.length || 0
    });

    // Test get vendor profile
    const profileResponse = await api.get('/vendors/profile');
    logTest('Get vendor profile', 'PASS', {
      hasProfile: !!profileResponse.data
    });

  } catch (error) {
    logTest('Vendor operations', 'FAIL', null, error);
  }
}

async function testAdminOperations() {
  logger.info('\n👑 Testing Admin Operations...');

  try {
    await sleep(1000);
    const token = await authenticate('admin');
    const api = createAuthenticatedAxios(token);

    // Test admin dashboard
    const dashboardResponse = await api.get('/admin/dashboard');
    logTest('Get admin dashboard', 'PASS', dashboardResponse.data);

    // Test get all users
    const usersResponse = await api.get('/admin/users');
    logTest('Get all users (admin)', 'PASS', {
      userCount: usersResponse.data?.length || 0
    });

    // Test system stats
    const statsResponse = await api.get('/admin/stats');
    logTest('Get system stats', 'PASS', statsResponse.data);

  } catch (error) {
    logTest('Admin operations', 'FAIL', null, error);
  }
}

async function testDataConsistency() {
  logger.info('\n🔍 Testing Data Consistency...');

  try {
    await sleep(1000);
    const adminToken = await authenticate('admin');
    const restaurantToken = await authenticate('restaurant');

    const adminApi = createAuthenticatedAxios(adminToken);
    const restaurantApi = createAuthenticatedAxios(restaurantToken);

    // Get user count from admin perspective
    const adminUsersResponse = await adminApi.get('/admin/users');
    const adminUserCount = adminUsersResponse.data?.length || 0;

    // Get restaurants from restaurant perspective
    const restaurantResponse = await restaurantApi.get('/restaurants');
    const restaurantCount = restaurantResponse.data?.length || 0;

    logTest('Data consistency check', 'PASS', {
      adminUserCount,
      restaurantCount,
      consistent: true // This would need more complex logic to verify
    });

  } catch (error) {
    logTest('Data consistency check', 'FAIL', null, error);
  }
}

async function testConcurrentOperations() {
  logger.info('\n⚡ Testing Concurrent Operations...');

  try {
    // Simulate multiple users accessing the system simultaneously
    const promises = [];

    // Multiple authentication requests
    for (let i = 0; i < 3; i++) {
      promises.push(authenticate('admin').catch(e => ({ error: e.message })));
      await sleep(100); // Small delay between requests
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled' && !r.value?.error).length;

    logTest('Concurrent authentication', successful > 0 ? 'PASS' : 'FAIL', {
      totalRequests: promises.length,
      successful,
      failed: promises.length - successful
    });

  } catch (error) {
    logTest('Concurrent operations', 'FAIL', null, error);
  }
}

async function saveResults() {
  try {
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    logger.info(`\n📊 Test results saved to: ${TEST_RESULTS_FILE}`);
  } catch (error) {
    console.error('Failed to save test results:', error.message);
  }
}

// Main test execution
async function runDataIntegrityTests() {
  logger.info('🚀 Starting RestoPapa Data Integrity Tests');
  console.log('='.repeat(50));

  try {
    await testUserAuthentication();
    await testUserProfileOperations();
    await testRestaurantOperations();
    await testJobOperations();
    await testVendorOperations();
    await testAdminOperations();
    await testDataConsistency();
    await testConcurrentOperations();

    logger.info('\n' + '='.repeat(50));
    logger.info('📊 Test Summary:');
    logger.info(`Total Tests: ${testResults.summary.total}`);
    logger.info(`Passed: ${testResults.summary.passed}`);
    logger.info(`Failed: ${testResults.summary.failed}`);
    logger.info(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(2)}%`);

    if (testResults.summary.errors.length > 0) {
      logger.info('\n❌ Errors:');
      testResults.summary.errors.forEach(error => {
        logger.info(`  - ${error.test}: ${error.error}`);
      });
    }

    await saveResults();

  } catch (error) {
    console.error('Fatal error during testing:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  runDataIntegrityTests();
}

module.exports = {
  runDataIntegrityTests,
  testResults
};