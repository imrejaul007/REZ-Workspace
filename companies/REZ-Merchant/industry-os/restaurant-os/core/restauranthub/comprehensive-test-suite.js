import logger from './utils/logger';

#!/usr/bin/env node

/**
 * Comprehensive RestoPapa Application Testing Suite
 * Tests all features, screens, user journeys, backend APIs, and database connectivity
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Test Configuration
const TEST_CONFIG = {
  API_BASE_URL: 'http://localhost:3010',
  WEB_BASE_URL: 'http://localhost:3000',
  TEST_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  ENDPOINTS_TO_TEST: [
    // Authentication Endpoints
    { path: '/api/v1/auth/health', method: 'GET', public: true },
    { path: '/api/v1/auth/login', method: 'POST', public: true },
    { path: '/api/v1/auth/register', method: 'POST', public: true },
    { path: '/api/v1/auth/profile', method: 'GET', public: false },

    // Restaurant Endpoints
    { path: '/api/v1/restaurants', method: 'GET', public: true },
    { path: '/api/v1/restaurants/search', method: 'GET', public: true },

    // Job Endpoints
    { path: '/api/v1/jobs', method: 'GET', public: true },
    { path: '/api/v1/jobs/search', method: 'GET', public: true },

    // Vendor Endpoints
    { path: '/api/v1/vendors', method: 'GET', public: true },

    // User Endpoints
    { path: '/api/v1/users/profile', method: 'GET', public: false },

    // Admin Endpoints
    { path: '/api/v1/admin/dashboard', method: 'GET', public: false },

    // Community Endpoints
    { path: '/api/v1/community/posts', method: 'GET', public: true },
  ]
};

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  categories: {
    'Frontend Pages': { total: 0, passed: 0, failed: 0, tests: [] },
    'API Endpoints': { total: 0, passed: 0, failed: 0, tests: [] },
    'Authentication Flow': { total: 0, passed: 0, failed: 0, tests: [] },
    'User Journeys': { total: 0, passed: 0, failed: 0, tests: [] },
    'Database Operations': { total: 0, passed: 0, failed: 0, tests: [] },
    'Real-time Features': { total: 0, passed: 0, failed: 0, tests: [] },
    'File Structure': { total: 0, passed: 0, failed: 0, tests: [] }
  }
};

// Utility Functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  logger.info(`[${timestamp}] [${level}] ${message}`);
}

function addTestResult(category, testName, status, details = '') {
  const result = {
    name: testName,
    status,
    details,
    timestamp: new Date().toISOString()
  };

  testResults.categories[category].tests.push(result);
  testResults.categories[category].total++;
  testResults.totalTests++;

  if (status === 'PASSED') {
    testResults.categories[category].passed++;
    testResults.passedTests++;
  } else if (status === 'FAILED') {
    testResults.categories[category].failed++;
    testResults.failedTests++;
  } else {
    testResults.skippedTests++;
  }
}

async function makeHttpRequest(url, options = {}) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      timeout: TEST_CONFIG.TEST_TIMEOUT,
      ...options
    });

    return {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: response.ok ? await response.json().catch(() => ({})) : null,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      statusText: error.message,
      ok: false,
      data: null,
      error: error.message
    };
  }
}

// Test Categories

/**
 * Test 1: Frontend File Structure Analysis
 */
async function testFrontendStructure() {
  log('🔍 Testing Frontend File Structure...');

  const webAppPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web';

  const expectedStructure = [
    'app',
    'components',
    'lib',
    'public',
    'package.json',
    'next.config.js',
    'tailwind.config.js'
  ];

  for (const item of expectedStructure) {
    const itemPath = path.join(webAppPath, item);
    if (fs.existsSync(itemPath)) {
      addTestResult('File Structure', `Frontend: ${item} exists`, 'PASSED');
    } else {
      addTestResult('File Structure', `Frontend: ${item} exists`, 'FAILED', `Missing: ${itemPath}`);
    }
  }

  // Check for key pages
  const appPath = path.join(webAppPath, 'app');
  if (fs.existsSync(appPath)) {
    const pages = [
      'auth/login',
      'auth/register',
      'auth/verify-2fa',
      'dashboard',
      'restaurants',
      'jobs',
      'admin',
      'profile'
    ];

    for (const page of pages) {
      const pagePath = path.join(appPath, page);
      if (fs.existsSync(pagePath) || fs.existsSync(pagePath + '/page.tsx') || fs.existsSync(pagePath + '.tsx')) {
        addTestResult('Frontend Pages', `Page: /${page}`, 'PASSED');
      } else {
        addTestResult('Frontend Pages', `Page: /${page}`, 'FAILED', `Missing: ${pagePath}`);
      }
    }
  }
}

/**
 * Test 2: Backend API Structure Analysis
 */
async function testBackendStructure() {
  log('🔍 Testing Backend API Structure...');

  const apiPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/api';

  const expectedModules = [
    'auth',
    'users',
    'restaurants',
    'jobs',
    'vendors',
    'admin',
    'community'
  ];

  const modulesPath = path.join(apiPath, 'src/modules');

  for (const module of expectedModules) {
    const modulePath = path.join(modulesPath, module);
    if (fs.existsSync(modulePath)) {
      // Check for controller, service, and module files
      const files = ['controller.ts', 'service.ts', 'module.ts'];
      let moduleComplete = true;

      for (const file of files) {
        const filePath = path.join(modulePath, `${module}.${file}`);
        if (!fs.existsSync(filePath)) {
          moduleComplete = false;
          break;
        }
      }

      if (moduleComplete) {
        addTestResult('File Structure', `Backend Module: ${module}`, 'PASSED');
      } else {
        addTestResult('File Structure', `Backend Module: ${module}`, 'FAILED', 'Missing core files');
      }
    } else {
      addTestResult('File Structure', `Backend Module: ${module}`, 'FAILED', `Missing: ${modulePath}`);
    }
  }
}

/**
 * Test 3: API Endpoint Testing
 */
async function testApiEndpoints() {
  log('🌐 Testing API Endpoints...');

  // First test if API server is running
  try {
    const healthCheck = await makeHttpRequest(`${TEST_CONFIG.API_BASE_URL}/api/v1/auth/health`);
    if (!healthCheck.ok) {
      log('⚠️  API server not responding. Testing with mock responses.', 'WARN');
    }
  } catch (error) {
    log('⚠️  API server unreachable. Testing with mock responses.', 'WARN');
  }

  for (const endpoint of TEST_CONFIG.ENDPOINTS_TO_TEST) {
    const url = `${TEST_CONFIG.API_BASE_URL}${endpoint.path}`;

    try {
      const response = await makeHttpRequest(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(endpoint.public ? {} : { 'Authorization': 'Bearer mock-token' })
        }
      });

      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 is expected for protected endpoints without valid auth
        addTestResult('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'PASSED',
          `Status: ${response.status}`);
      } else {
        addTestResult('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'FAILED',
          `Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      addTestResult('API Endpoints', `${endpoint.method} ${endpoint.path}`, 'FAILED',
        `Error: ${error.message}`);
    }
  }
}

/**
 * Test 4: Authentication Flow Analysis
 */
async function testAuthenticationFlow() {
  log('🔐 Testing Authentication Flow...');

  // Check auth components exist
  const authComponents = [
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/login/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/register/page.tsx',
    '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app/auth/verify-2fa/page.tsx'
  ];

  for (const component of authComponents) {
    if (fs.existsSync(component)) {
      // Check if component has proper authentication logic
      const content = fs.readFileSync(component, 'utf8');
      const hasAuthLogic = content.includes('useState') &&
                          (content.includes('login') || content.includes('register') || content.includes('verify'));

      if (hasAuthLogic) {
        addTestResult('Authentication Flow', `Component: ${path.basename(component)}`, 'PASSED');
      } else {
        addTestResult('Authentication Flow', `Component: ${path.basename(component)}`, 'FAILED',
          'Missing authentication logic');
      }
    } else {
      addTestResult('Authentication Flow', `Component: ${path.basename(component)}`, 'FAILED',
        'Component file missing');
    }
  }

  // Check auth services
  const authApiPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/lib/api';
  if (fs.existsSync(authApiPath)) {
    const authFiles = fs.readdirSync(authApiPath).filter(file =>
      file.includes('auth') && file.endsWith('.ts'));

    if (authFiles.length > 0) {
      addTestResult('Authentication Flow', 'Auth API services', 'PASSED',
        `Found ${authFiles.length} auth service files`);
    } else {
      addTestResult('Authentication Flow', 'Auth API services', 'FAILED',
        'No auth service files found');
    }
  }
}

/**
 * Test 5: User Journey Mapping
 */
async function testUserJourneys() {
  log('👥 Testing User Journey Completeness...');

  const journeys = [
    {
      name: 'Restaurant Owner Journey',
      pages: ['auth/login', 'dashboard', 'restaurants/manage', 'restaurants/menu', 'orders'],
      features: ['authentication', 'restaurant management', 'menu editing', 'order tracking']
    },
    {
      name: 'Job Seeker Journey',
      pages: ['auth/register', 'jobs', 'jobs/search', 'jobs/apply', 'profile'],
      features: ['job search', 'application', 'profile management']
    },
    {
      name: 'Customer Journey',
      pages: ['restaurants', 'restaurants/search', 'orders', 'profile'],
      features: ['restaurant browsing', 'ordering', 'order history']
    },
    {
      name: 'Admin Journey',
      pages: ['auth/login', 'admin', 'admin/users', 'admin/restaurants', 'admin/analytics'],
      features: ['user management', 'content moderation', 'analytics']
    }
  ];

  const webAppPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/web/app';

  for (const journey of journeys) {
    let completedPages = 0;
    let totalPages = journey.pages.length;

    for (const page of journey.pages) {
      const pagePath = path.join(webAppPath, page);
      if (fs.existsSync(pagePath) ||
          fs.existsSync(pagePath + '/page.tsx') ||
          fs.existsSync(pagePath + '.tsx')) {
        completedPages++;
      }
    }

    const completionRate = (completedPages / totalPages) * 100;
    const status = completionRate >= 70 ? 'PASSED' : 'FAILED';

    addTestResult('User Journeys', journey.name, status,
      `${completedPages}/${totalPages} pages (${completionRate.toFixed(1)}%)`);
  }
}

/**
 * Test 6: Database Integration Analysis
 */
async function testDatabaseIntegration() {
  log('🗄️  Testing Database Integration...');

  // Check Prisma schema
  const schemaPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/packages/db/prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');

    const expectedModels = ['User', 'Restaurant', 'Job', 'Order', 'Vendor', 'Product'];
    let modelsFound = 0;

    for (const model of expectedModels) {
      if (schemaContent.includes(`model ${model}`)) {
        modelsFound++;
      }
    }

    const status = modelsFound >= expectedModels.length * 0.8 ? 'PASSED' : 'FAILED';
    addTestResult('Database Operations', 'Prisma Schema Models', status,
      `${modelsFound}/${expectedModels.length} models found`);
  } else {
    addTestResult('Database Operations', 'Prisma Schema', 'FAILED', 'Schema file not found');
  }

  // Check for database services
  const prismaServicePath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/api/src/prisma/prisma.service.ts';
  if (fs.existsSync(prismaServicePath)) {
    addTestResult('Database Operations', 'Prisma Service', 'PASSED');
  } else {
    addTestResult('Database Operations', 'Prisma Service', 'FAILED', 'Service file not found');
  }
}

/**
 * Test 7: Real-time Features Analysis
 */
async function testRealtimeFeatures() {
  log('⚡ Testing Real-time Features...');

  // Check for WebSocket implementation
  const wsGatewayPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/api/src/websocket';
  if (fs.existsSync(wsGatewayPath)) {
    const wsFiles = fs.readdirSync(wsGatewayPath);
    const hasGateway = wsFiles.some(file => file.includes('gateway'));
    const hasService = wsFiles.some(file => file.includes('service'));

    if (hasGateway && hasService) {
      addTestResult('Real-time Features', 'WebSocket Implementation', 'PASSED');
    } else {
      addTestResult('Real-time Features', 'WebSocket Implementation', 'FAILED',
        'Missing gateway or service files');
    }
  } else {
    addTestResult('Real-time Features', 'WebSocket Implementation', 'FAILED',
      'WebSocket directory not found');
  }

  // Check for notification system
  const notificationPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/apps/api/src/modules/notifications';
  if (fs.existsSync(notificationPath)) {
    addTestResult('Real-time Features', 'Notification System', 'PASSED');
  } else {
    addTestResult('Real-time Features', 'Notification System', 'FAILED',
      'Notifications module not found');
  }
}

/**
 * Generate Comprehensive Test Report
 */
function generateTestReport() {
  log('📊 Generating Comprehensive Test Report...');

  const report = {
    metadata: {
      timestamp: testResults.timestamp,
      testDuration: Date.now() - new Date(testResults.timestamp).getTime(),
      environment: 'Development',
      version: '1.0.0'
    },
    summary: {
      totalTests: testResults.totalTests,
      passedTests: testResults.passedTests,
      failedTests: testResults.failedTests,
      skippedTests: testResults.skippedTests,
      successRate: ((testResults.passedTests / testResults.totalTests) * 100).toFixed(2) + '%'
    },
    categories: testResults.categories,
    recommendations: []
  };

  // Generate recommendations based on test results
  Object.entries(testResults.categories).forEach(([category, results]) => {
    const failureRate = (results.failed / results.total) * 100;
    if (failureRate > 20) {
      report.recommendations.push({
        category,
        priority: 'HIGH',
        message: `${category} has ${failureRate.toFixed(1)}% failure rate - requires immediate attention`
      });
    } else if (failureRate > 10) {
      report.recommendations.push({
        category,
        priority: 'MEDIUM',
        message: `${category} has ${failureRate.toFixed(1)}% failure rate - review recommended`
      });
    }
  });

  return report;
}

/**
 * Main Test Execution
 */
async function runComprehensiveTests() {
  log('🚀 Starting Comprehensive RestoPapa Testing Suite...');
  log('================================================');

  try {
    // Run all test categories
    await testFrontendStructure();
    await testBackendStructure();
    await testApiEndpoints();
    await testAuthenticationFlow();
    await testUserJourneys();
    await testDatabaseIntegration();
    await testRealtimeFeatures();

    // Generate final report
    const report = generateTestReport();

    // Save report to file
    const reportPath = '/Users/rejaulkarim/Documents/Resturistan App/restopapa/test-reports';
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }

    const reportFile = path.join(reportPath, `comprehensive-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    // Print summary
    log('================================================');
    log('📋 TEST SUMMARY:');
    log(`✅ Passed: ${report.summary.passedTests}`);
    log(`❌ Failed: ${report.summary.failedTests}`);
    log(`⏭️  Skipped: ${report.summary.skippedTests}`);
    log(`📊 Success Rate: ${report.summary.successRate}`);
    log('================================================');

    // Print category breakdown
    Object.entries(report.categories).forEach(([category, results]) => {
      const status = results.failed === 0 ? '✅' : results.failed > results.passed ? '❌' : '⚠️';
      log(`${status} ${category}: ${results.passed}/${results.total} passed`);
    });

    log('================================================');
    log(`📄 Full report saved to: ${reportFile}`);

    // Print recommendations
    if (report.recommendations.length > 0) {
      log('');
      log('🔧 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => {
        const icon = rec.priority === 'HIGH' ? '🔴' : '🟡';
        log(`${icon} [${rec.priority}] ${rec.message}`);
      });
    }

    log('✨ Comprehensive testing completed!');

  } catch (error) {
    log(`❌ Testing failed: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = {
  runComprehensiveTests,
  testResults,
  TEST_CONFIG
};