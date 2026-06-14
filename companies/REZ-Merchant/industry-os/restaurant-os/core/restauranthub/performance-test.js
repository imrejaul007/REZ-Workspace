import logger from './utils/logger';

#!/usr/bin/env node

const https = require('http');
const { performance } = require('perf_hooks');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  concurrentUsers: [10, 50, 100, 200, 500],
  testDurationMs: 30000, // 30 seconds per test
  endpoints: [
    { path: '/api/v1/auth/health', method: 'GET' },
    { path: '/api/v1/auth/signin', method: 'POST', body: JSON.stringify({email: 'admin@restopapa.com', password: 'admin123'}) },
    { path: '/api/v1/jobs', method: 'GET' },
    { path: '/api/v1/restaurants', method: 'GET' }
  ]
};

class PerformanceTester {
  constructor() {
    this.results = {};
    this.authToken = null;
  }

  async authenticate() {
    logger.info('🔐 Authenticating...');
    try {
      const response = await this.makeRequest({
        path: '/api/v1/auth/signin',
        method: 'POST',
        body: JSON.stringify({email: 'admin@restopapa.com', password: 'admin123'})
      });

      if (response.data && response.data.accessToken) {
        this.authToken = response.data.accessToken;
        logger.info('✅ Authentication successful');
      }
    } catch (error) {
      console.log('❌ Authentication failed:', error.message);
    }
  }

  makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      const url = new URL(endpoint.path, CONFIG.baseUrl);

      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RestoPapa-PerformanceTest/1.0'
        }
      };

      if (this.authToken && endpoint.path !== '/api/v1/auth/signin' && endpoint.path !== '/api/v1/auth/health') {
        options.headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;

          let parsedData = null;
          try {
            parsedData = JSON.parse(data);
          } catch (e) {
            parsedData = data;
          }

          resolve({
            statusCode: res.statusCode,
            responseTime,
            data: parsedData,
            dataSize: data.length
          });
        });
      });

      req.on('error', (error) => {
        const endTime = performance.now();
        reject({
          error: error.message,
          responseTime: endTime - startTime
        });
      });

      if (endpoint.body) {
        req.write(endpoint.body);
      }

      req.end();
    });
  }

  async runLoadTest(users, endpoint) {
    logger.info(`🚀 Testing ${endpoint.method} ${endpoint.path} with ${users} concurrent users...`);

    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      statusCodes: {},
      errors: [],
      startTime: Date.now()
    };

    const promises = [];
    const endTime = Date.now() + CONFIG.testDurationMs;

    // Create concurrent user sessions
    for (let user = 0; user < users; user++) {
      promises.push(this.simulateUser(endpoint, endTime, results));
    }

    await Promise.all(promises);

    // Calculate statistics
    const responseTimes = results.responseTimes.sort((a, b) => a - b);
    const totalTime = Date.now() - results.startTime;

    return {
      endpoint: `${endpoint.method} ${endpoint.path}`,
      concurrentUsers: users,
      duration: totalTime,
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests,
      failedRequests: results.failedRequests,
      requestsPerSecond: (results.totalRequests / (totalTime / 1000)).toFixed(2),
      averageResponseTime: responseTimes.length > 0 ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2) : 0,
      medianResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length / 2)].toFixed(2) : 0,
      p95ResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)].toFixed(2) : 0,
      p99ResponseTime: responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)].toFixed(2) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes).toFixed(2) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes).toFixed(2) : 0,
      errorRate: ((results.failedRequests / results.totalRequests) * 100).toFixed(2),
      statusCodes: results.statusCodes,
      errors: results.errors.slice(0, 5) // Show first 5 errors
    };
  }

  async simulateUser(endpoint, endTime, results) {
    while (Date.now() < endTime) {
      try {
        const response = await this.makeRequest(endpoint);
        results.totalRequests++;
        results.responseTimes.push(response.responseTime);
        results.statusCodes[response.statusCode] = (results.statusCodes[response.statusCode] || 0) + 1;

        if (response.statusCode >= 200 && response.statusCode < 400) {
          results.successfulRequests++;
        } else {
          results.failedRequests++;
          results.errors.push(`${response.statusCode}: ${JSON.stringify(response.data)}`);
        }
      } catch (error) {
        results.totalRequests++;
        results.failedRequests++;
        results.errors.push(error.error || error.message);
        if (error.responseTime) {
          results.responseTimes.push(error.responseTime);
        }
      }

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  async runFullPerformanceTest() {
    logger.info('🎯 Starting RestoPapa Performance Test Suite');
    logger.info(`📊 Testing ${CONFIG.concurrentUsers.length} load levels for ${CONFIG.endpoints.length} endpoints`);
    logger.info(`⏱️  Each test runs for ${CONFIG.testDurationMs / 1000} seconds\n`);

    // Authenticate once
    await this.authenticate();

    const allResults = [];

    for (const endpoint of CONFIG.endpoints) {
      logger.info(`\n📡 Testing endpoint: ${endpoint.method} ${endpoint.path}`);

      for (const users of CONFIG.concurrentUsers) {
        try {
          const result = await this.runLoadTest(users, endpoint);
          allResults.push(result);

          logger.info(`   ${users} users: ${result.requestsPerSecond} req/s, avg: ${result.averageResponseTime}ms, p95: ${result.p95ResponseTime}ms, errors: ${result.errorRate}%`);

          // Cool down between tests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          logger.error(   ❌ Test failed for ${users} users:`, error.message);
        }
      }
    }

    this.generateReport(allResults);
  }

  generateReport(results) {
    logger.info('\n' + '='.repeat(80));
    logger.info('📊 PERFORMANCE TEST RESULTS SUMMARY');
    console.log('='.repeat(80));

    // Group results by endpoint
    const endpointGroups = {};
    results.forEach(result => {
      if (!endpointGroups[result.endpoint]) {
        endpointGroups[result.endpoint] = [];
      }
      endpointGroups[result.endpoint].push(result);
    });

    Object.entries(endpointGroups).forEach(([endpoint, endpointResults]) => {
      logger.info(`\n🎯 ${endpoint}`);
      console.log('-'.repeat(60));
      logger.info('Users | Req/s  | Avg(ms) | P95(ms) | P99(ms) | Errors(%)');
      console.log('-'.repeat(60));

      endpointResults.forEach(result => {
        console.log(
          `${result.concurrentUsers.toString().padStart(5)} | ` +
          `${result.requestsPerSecond.padStart(6)} | ` +
          `${result.averageResponseTime.padStart(7)} | ` +
          `${result.p95ResponseTime.padStart(7)} | ` +
          `${result.p99ResponseTime.padStart(7)} | ` +
          `${result.errorRate.padStart(8)}`
        );
      });
    });

    // Performance thresholds analysis
    logger.info('\n🚨 PERFORMANCE THRESHOLD ANALYSIS');
    console.log('-'.repeat(60));

    const failedTests = results.filter(r =>
      parseFloat(r.p95ResponseTime) > 2000 ||
      parseFloat(r.errorRate) > 5 ||
      parseFloat(r.requestsPerSecond) < 10
    );

    if (failedTests.length > 0) {
      logger.info('❌ TESTS THAT FAILED PERFORMANCE THRESHOLDS:');
      failedTests.forEach(test => {
        const issues = [];
        if (parseFloat(test.p95ResponseTime) > 2000) issues.push(`P95 > 2s (${test.p95ResponseTime}ms)`);
        if (parseFloat(test.errorRate) > 5) issues.push(`Error rate > 5% (${test.errorRate}%)`);
        if (parseFloat(test.requestsPerSecond) < 10) issues.push(`RPS < 10 (${test.requestsPerSecond})`);

        logger.info(`   ${test.endpoint} @ ${test.concurrentUsers} users: ${issues.join(', ')}`);
      });
    } else {
      logger.info('✅ All tests passed performance thresholds!');
    }

    // Recommendations
    logger.info('\n💡 PERFORMANCE RECOMMENDATIONS');
    console.log('-'.repeat(60));

    const highErrorRateTests = results.filter(r => parseFloat(r.errorRate) > 1);
    const slowResponseTests = results.filter(r => parseFloat(r.p95ResponseTime) > 1000);
    const lowThroughputTests = results.filter(r => parseFloat(r.requestsPerSecond) < 50);

    if (highErrorRateTests.length > 0) {
      logger.info('🔴 HIGH ERROR RATES DETECTED:');
      logger.info('   - Investigate authentication and authorization logic');
      logger.info('   - Check database connection pooling');
      logger.info('   - Review error handling and logging');
    }

    if (slowResponseTests.length > 0) {
      logger.info('🟡 SLOW RESPONSE TIMES DETECTED:');
      logger.info('   - Add database query optimization and indexing');
      logger.info('   - Implement caching for frequently accessed data');
      logger.info('   - Consider API response compression');
      logger.info('   - Review N+1 query patterns');
    }

    if (lowThroughputTests.length > 0) {
      logger.info('🟠 LOW THROUGHPUT DETECTED:');
      logger.info('   - Scale API horizontally with load balancers');
      logger.info('   - Optimize database connection pools');
      logger.info('   - Implement rate limiting to protect infrastructure');
      logger.info('   - Consider CDN for static assets');
    }

    logger.info('\n✨ Test completed successfully!');
  }
}

// Run the performance test
const tester = new PerformanceTester();
tester.runFullPerformanceTest().catch(console.error);