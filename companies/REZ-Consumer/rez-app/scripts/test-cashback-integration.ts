import logger from './utils/logger';

/**
 * CASHBACK INTEGRATION TEST
 *
 * Tests the complete cashback flow from backend to frontend
 *
 * Prerequisites:
 * - Backend server running on http://localhost:5001
 * - User authenticated with valid token
 * - UserCashback model initialized
 *
 * Run: npx ts-node scripts/test-cashback-integration.ts
 */

import cashbackService from '../services/cashbackApi';
import apiClient from '../services/apiClient';

// Test configuration
const TEST_CONFIG = {
  userId: 'test-user-id',
  authToken: 'your-test-auth-token-here',
  baseUrl: 'http://localhost:5001'
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper functions
const log = {
  header: (msg: string) => logger.info(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`),
  success: (msg: string) => logger.info(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => logger.info(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => logger.info(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg: string) => logger.info(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  section: (msg: string) => logger.info(`\n${colors.bright}${colors.blue}${msg}${colors.reset}`),
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Main test function
async function runCashbackTests() {
  log.header('');
  logger.info(`${colors.bright}CASHBACK INTEGRATION TEST${colors.reset}`);
  log.header('');

  log.info(`Backend URL: ${TEST_CONFIG.baseUrl}`);
  log.info(`Starting tests at: ${new Date().toLocaleString()}`);

  try {
    // Initialize API client
    apiClient.setBaseURL(TEST_CONFIG.baseUrl);

    // Note: In real scenario, you would authenticate first
    // For now, we'll attempt without auth to show what happens
    log.warning('Authentication token not set - some tests may fail');

    // TEST 1: Get Cashback Summary
    await testCashbackSummary();

    // TEST 2: Get Cashback History
    await testCashbackHistory();

    // TEST 3: Get Pending Cashback
    await testPendingCashback();

    // TEST 4: Get Expiring Soon Cashback
    await testExpiringSoonCashback();

    // TEST 5: Get Active Campaigns
    await testActiveCampaigns();

    // TEST 6: Forecast Cashback
    await testForecastCashback();

    // TEST 7: Get Cashback Statistics
    await testCashbackStatistics();

    // Display final results
    displayTestResults();

  } catch (error) {
    log.error(`Fatal error in test suite: ${error.message}`);
    process.exit(1);
  }
}

// Test 1: Get Cashback Summary
async function testCashbackSummary() {
  log.section('TEST 1: Get Cashback Summary');

  try {
    const response = await cashbackService.getCashbackSummary();

    if (response.success && response.data) {
      log.success('Cashback summary retrieved successfully');
      logger.info(`   Total Earned: ₹${response.data.totalEarned}`);
      logger.info(`   Pending: ₹${response.data.pending} (${response.data.pendingCount} items)`);
      logger.info(`   Credited: ₹${response.data.credited} (${response.data.creditedCount} items)`);
      logger.info(`   Expired: ₹${response.data.expired} (${response.data.expiredCount} items)`);
      testResults.passed++;
    } else {
      log.error(`Failed to get cashback summary: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testCashbackSummary: ${error.message}`);
    testResults.failed++;
  }
}

// Test 2: Get Cashback History
async function testCashbackHistory() {
  log.section('TEST 2: Get Cashback History');

  try {
    const response = await cashbackService.getCashbackHistory({
      page: 1,
      limit: 10
    });

    if (response.success && response.data) {
      log.success(`Cashback history retrieved: ${response.data.cashbacks.length} items`);
      logger.info(`   Total records: ${response.data.total}`);
      logger.info(`   Pages: ${response.data.pages}`);

      if (response.data.cashbacks.length > 0) {
        const firstCashback = response.data.cashbacks[0];
        logger.info(`   First item: ₹${firstCashback.amount} - ${firstCashback.source} - ${firstCashback.status}`);
      }
      testResults.passed++;
    } else {
      log.error(`Failed to get cashback history: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testCashbackHistory: ${error.message}`);
    testResults.failed++;
  }
}

// Test 3: Get Pending Cashback
async function testPendingCashback() {
  log.section('TEST 3: Get Pending Cashback');

  try {
    const response = await cashbackService.getPendingCashback();

    if (response.success && response.data) {
      log.success('Pending cashback retrieved successfully');
      logger.info(`   Total Amount: ₹${response.data.totalAmount}`);
      logger.info(`   Count: ${response.data.count}`);
      testResults.passed++;
    } else {
      log.error(`Failed to get pending cashback: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testPendingCashback: ${error.message}`);
    testResults.failed++;
  }
}

// Test 4: Get Expiring Soon Cashback
async function testExpiringSoonCashback() {
  log.section('TEST 4: Get Expiring Soon Cashback');

  try {
    const response = await cashbackService.getExpiringSoon(7);

    if (response.success && response.data) {
      log.success('Expiring soon cashback retrieved successfully');
      logger.info(`   Total Amount: ₹${response.data.totalAmount}`);
      logger.info(`   Count: ${response.data.count}`);
      testResults.passed++;
    } else {
      log.error(`Failed to get expiring soon cashback: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testExpiringSoonCashback: ${error.message}`);
    testResults.failed++;
  }
}

// Test 5: Get Active Campaigns
async function testActiveCampaigns() {
  log.section('TEST 5: Get Active Campaigns');

  try {
    const response = await cashbackService.getActiveCampaigns();

    if (response.success && response.data) {
      log.success(`Active campaigns retrieved: ${response.data.campaigns.length} campaigns`);

      if (response.data.campaigns.length > 0) {
        const firstCampaign = response.data.campaigns[0];
        logger.info(`   First campaign: ${firstCampaign.name} - ${firstCampaign.cashbackRate}%`);
      }
      testResults.passed++;
    } else {
      log.error(`Failed to get active campaigns: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testActiveCampaigns: ${error.message}`);
    testResults.failed++;
  }
}

// Test 6: Forecast Cashback
async function testForecastCashback() {
  log.section('TEST 6: Forecast Cashback');

  try {
    const mockCartData = {
      items: [
        {
          product: { _id: 'prod1', category: 'Electronics' },
          quantity: 1,
          price: 5000
        },
        {
          product: { _id: 'prod2', category: 'Fashion' },
          quantity: 2,
          price: 1500
        }
      ],
      subtotal: 8000
    };

    const response = await cashbackService.forecastCashback(mockCartData);

    if (response.success && response.data) {
      log.success('Cashback forecast calculated successfully');
      logger.info(`   Estimated Cashback: ₹${response.data.estimatedCashback}`);
      logger.info(`   Cashback Rate: ${response.data.cashbackRate}%`);
      logger.info(`   Description: ${response.data.description}`);
      testResults.passed++;
    } else {
      log.error(`Failed to forecast cashback: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testForecastCashback: ${error.message}`);
    testResults.failed++;
  }
}

// Test 7: Get Cashback Statistics
async function testCashbackStatistics() {
  log.section('TEST 7: Get Cashback Statistics');

  try {
    const response = await cashbackService.getStatistics('month');

    if (response.success && response.data) {
      log.success('Cashback statistics retrieved successfully');
      logger.info(`   Period: ${response.data.period}`);
      logger.info(`   Total Amount: ₹${response.data.totalAmount}`);
      logger.info(`   Total Count: ${response.data.totalCount}`);
      logger.info(`   Average Per Transaction: ₹${response.data.averagePerTransaction}`);
      testResults.passed++;
    } else {
      log.error(`Failed to get cashback statistics: ${response.error}`);
      testResults.failed++;
    }
  } catch (error) {
    log.error(`Exception in testCashbackStatistics: ${error.message}`);
    testResults.failed++;
  }
}

// Display test results
function displayTestResults() {
  log.header('');
  logger.info(`${colors.bright}TEST RESULTS SUMMARY${colors.reset}`);
  log.header('');

  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = total > 0 ? ((testResults.passed / total) * 100).toFixed(2) : '0.00';

  logger.info(`${colors.green}Passed:  ${testResults.passed}${colors.reset}`);
  logger.info(`${colors.red}Failed:  ${testResults.failed}${colors.reset}`);
  logger.info(`${colors.yellow}Skipped: ${testResults.skipped}${colors.reset}`);
  logger.info(`${colors.cyan}Total:   ${total}${colors.reset}`);
  logger.info(`\nPass Rate: ${passRate}%`);

  log.header('');

  if (testResults.failed === 0) {
    log.success('All tests passed! 🎉');
  } else {
    log.warning('Some tests failed. Please review the errors above.');
  }

  log.info(`Test completed at: ${new Date().toLocaleString()}`);
}

// Run tests
logger.info('Starting Cashback Integration Tests...\n');
runCashbackTests()
  .then(() => {
    process.exit(testResults.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    log.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
