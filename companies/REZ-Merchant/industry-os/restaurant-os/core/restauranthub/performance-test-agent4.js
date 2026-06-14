import logger from './utils/logger';

#!/usr/bin/env node

/**
 * AGENT 4: SCALABILITY & PERFORMANCE TESTER
 * Comprehensive performance testing suite using Node.js
 */

const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

class PerformanceTester {
  constructor(baseUrl = 'http://localhost:3070') {
    this.baseUrl = baseUrl;
    this.results = {
      testStartTime: new Date().toISOString(),
      responses: [],
      errors: [],
      metrics: {},
      concurrencyResults: []
    };
  }

  // Make HTTP request with timing
  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve) => {
      const start = performance.now();
      const url = `${this.baseUrl}${endpoint}`;
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;

      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: 30000
      };

      const req = client.request(url, requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const end = performance.now();
          const duration = end - start;

          resolve({
            status: res.statusCode,
            duration,
            size: Buffer.byteLength(data),
            success: res.statusCode >= 200 && res.statusCode < 400,
            endpoint,
            timestamp: new Date().toISOString(),
            data: data.length < 1000 ? data : data.substring(0, 1000) + '...'
          });
        });
      });

      req.on('error', (error) => {
        const end = performance.now();
        const duration = end - start;

        resolve({
          status: 0,
          duration,
          size: 0,
          success: false,
          endpoint,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        const end = performance.now();
        const duration = end - start;

        resolve({
          status: 0,
          duration,
          size: 0,
          success: false,
          endpoint,
          timestamp: new Date().toISOString(),
          error: 'Request timeout'
        });
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  // Test individual endpoint
  async testEndpoint(endpoint, iterations = 5) {
    logger.info(`Testing ${endpoint}...`);
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const result = await this.makeRequest(endpoint);
      results.push(result);
      this.results.responses.push(result);

      if (!result.success) {
        this.results.errors.push(result);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  // Test concurrent requests
  async testConcurrency(endpoint, concurrentUsers = 10, duration = 30000) {
    logger.info(`Testing ${endpoint} with ${concurrentUsers} concurrent users for ${duration}ms...`);

    const startTime = Date.now();
    const promises = [];
    const results = [];

    for (let i = 0; i < concurrentUsers; i++) {
      const userPromise = this.simulateUser(endpoint, startTime + duration);
      promises.push(userPromise);
    }

    const userResults = await Promise.all(promises);

    // Flatten results
    userResults.forEach(userResult => {
      userResult.forEach(result => {
        results.push(result);
        this.results.responses.push(result);

        if (!result.success) {
          this.results.errors.push(result);
        }
      });
    });

    return results;
  }

  // Simulate single user behavior
  async simulateUser(endpoint, endTime) {
    const results = [];

    while (Date.now() < endTime) {
      const result = await this.makeRequest(endpoint);
      results.push(result);

      // Random delay between 1-3 seconds to simulate user behavior
      const delay = Math.random() * 2000 + 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return results;
  }

  // Authentication test
  async testAuthentication() {
    logger.info('Testing authentication endpoints...');

    const authPayload = {
      email: 'admin@restopapa.com',
      password: 'Password123'
    };

    // Test signin
    const signinResult = await this.makeRequest('/api/v1/auth/signin', {
      method: 'POST',
      body: authPayload
    });

    let authToken = null;
    if (signinResult.success && signinResult.data) {
      try {
        const parsed = JSON.parse(signinResult.data);
        authToken = parsed.accessToken;
      } catch (e) {
        logger.info('Could not parse auth response');
      }
    }

    // Test protected endpoint if we have token
    if (authToken) {
      const profileResult = await this.makeRequest('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      return { signinResult, profileResult };
    }

    return { signinResult };
  }

  // Calculate metrics
  calculateMetrics(results) {
    if (results.length === 0) return {};

    const successfulResults = results.filter(r => r.success);
    const durations = successfulResults.map(r => r.duration);

    if (durations.length === 0) {
      return {
        totalRequests: results.length,
        successfulRequests: 0,
        failedRequests: results.length,
        successRate: 0,
        errorRate: 100
      };
    }

    durations.sort((a, b) => a - b);

    return {
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: results.length - successfulResults.length,
      successRate: (successfulRequests.length / results.length) * 100,
      errorRate: ((results.length - successfulRequests.length) / results.length) * 100,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      p50: this.percentile(durations, 50),
      p90: this.percentile(durations, 90),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      requestsPerSecond: results.length / ((results[results.length - 1].timestamp - results[0].timestamp) / 1000),
      totalDataTransferred: successfulResults.reduce((sum, r) => sum + r.size, 0)
    };
  }

  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[index];
  }

  // Memory usage monitoring
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100
    };
  }

  // Run comprehensive test suite
  async runTestSuite() {
    logger.info('🚀 AGENT 4: SCALABILITY & PERFORMANCE TESTING');
    logger.info('================================================\n');

    const testStartTime = Date.now();

    // Test endpoints individually
    const endpoints = [
      '/api/v1/auth/health',
      '/api/v1/auth/redis-health',
      '/api/v1/jobs',
      '/api/v1/restaurants',
      '/api/v1/users/stats',
      '/api/v1/community'
    ];

    logger.info('📊 Testing Individual Endpoints\n');
    for (const endpoint of endpoints) {
      await this.testEndpoint(endpoint, 10);
      logger.info(`✓ Completed ${endpoint}`);
    }

    logger.info('\n🔐 Testing Authentication Flow\n');
    const authResults = await this.testAuthentication();
    logger.info('✓ Completed authentication tests');

    logger.info('\n⚡ Testing Concurrent Load\n');

    // Test with increasing concurrent users
    const concurrencyLevels = [5, 10, 25, 50];

    for (const level of concurrencyLevels) {
      logger.info(`Testing with ${level} concurrent users...`);
      const concurrentResults = await this.testConcurrency('/api/v1/auth/health', level, 15000);

      const metrics = this.calculateMetrics(concurrentResults);
      this.results.concurrencyResults.push({
        concurrentUsers: level,
        metrics
      });

      logger.info(`✓ Completed ${level} users - Avg RT: ${Math.round(metrics.averageResponseTime)}ms, Success: ${Math.round(metrics.successRate)}%`);

      // Memory check
      const memUsage = this.getMemoryUsage();
      logger.info(`  Memory usage: ${memUsage.heapUsed}MB heap, ${memUsage.rss}MB RSS`);
    }

    const testEndTime = Date.now();

    // Calculate overall metrics
    this.results.metrics = this.calculateMetrics(this.results.responses);
    this.results.testDuration = testEndTime - testStartTime;
    this.results.finalMemoryUsage = this.getMemoryUsage();

    // Generate report
    this.generateReport();

    return this.results;
  }

  // Generate comprehensive report
  generateReport() {
    const report = `# 🚀 AGENT 4: SCALABILITY & PERFORMANCE TEST REPORT

**Test Completed:** ${new Date().toISOString()}
**Test Duration:** ${Math.round(this.results.testDuration / 1000)}s
**Base URL:** ${this.baseUrl}

## 📊 OVERALL PERFORMANCE METRICS

| Metric | Value |
|--------|-------|
| **Total Requests** | ${this.results.metrics.totalRequests || 0} |
| **Successful Requests** | ${this.results.metrics.successfulRequests || 0} |
| **Failed Requests** | ${this.results.metrics.failedRequests || 0} |
| **Success Rate** | ${Math.round((this.results.metrics.successRate || 0) * 100) / 100}% |
| **Error Rate** | ${Math.round((this.results.metrics.errorRate || 0) * 100) / 100}% |
| **Average Response Time** | ${Math.round((this.results.metrics.averageResponseTime || 0) * 100) / 100}ms |
| **P95 Response Time** | ${Math.round((this.results.metrics.p95 || 0) * 100) / 100}ms |
| **P99 Response Time** | ${Math.round((this.results.metrics.p99 || 0) * 100) / 100}ms |
| **Requests Per Second** | ${Math.round((this.results.metrics.requestsPerSecond || 0) * 100) / 100} |

## ⚡ CONCURRENT USER TESTING RESULTS

${this.results.concurrencyResults.map(result => `
### ${result.concurrentUsers} Concurrent Users
- **Success Rate:** ${Math.round(result.metrics.successRate * 100) / 100}%
- **Average Response Time:** ${Math.round(result.metrics.averageResponseTime * 100) / 100}ms
- **P95 Response Time:** ${Math.round(result.metrics.p95 * 100) / 100}ms
- **Requests Per Second:** ${Math.round(result.metrics.requestsPerSecond * 100) / 100}
- **Error Rate:** ${Math.round(result.metrics.errorRate * 100) / 100}%
`).join('')}

## 🧠 MEMORY USAGE ANALYSIS

| Metric | Value |
|--------|-------|
| **Heap Used** | ${this.results.finalMemoryUsage.heapUsed}MB |
| **Heap Total** | ${this.results.finalMemoryUsage.heapTotal}MB |
| **RSS Memory** | ${this.results.finalMemoryUsage.rss}MB |
| **External Memory** | ${this.results.finalMemoryUsage.external}MB |

## 🚨 ERROR ANALYSIS

**Total Errors:** ${this.results.errors.length}

${this.results.errors.slice(0, 10).map(error => `
- **Endpoint:** ${error.endpoint}
- **Error:** ${error.error || 'HTTP ' + error.status}
- **Time:** ${error.timestamp}
`).join('')}

${this.results.errors.length > 10 ? `\n*... and ${this.results.errors.length - 10} more errors*` : ''}

## 🎯 PERFORMANCE ASSESSMENT

### Current Status: ${this.assessPerformance()}

### Key Findings:
${this.generateFindings()}

### Recommendations:
${this.generateRecommendations()}

---

**Test completed by Agent 4 - Performance Tester**
**Raw data available in performance-test-results.json**
`;

    // Write report to file
    fs.writeFileSync(
      path.join(__dirname, 'AGENT4_PERFORMANCE_TEST_REPORT.md'),
      report
    );

    // Write raw data
    fs.writeFileSync(
      path.join(__dirname, 'performance-test-results.json'),
      JSON.stringify(this.results, null, 2)
    );

    logger.info('\n📄 Performance test report generated:');
    logger.info('- AGENT4_PERFORMANCE_TEST_REPORT.md');
    logger.info('- performance-test-results.json');
  }

  assessPerformance() {
    const metrics = this.results.metrics;
    const successRate = metrics.successRate || 0;
    const avgResponseTime = metrics.averageResponseTime || 0;
    const p95ResponseTime = metrics.p95 || 0;

    if (successRate < 50) return '🚨 CRITICAL - High failure rate';
    if (avgResponseTime > 2000) return '⚠️ POOR - Slow response times';
    if (p95ResponseTime > 3000) return '⚠️ NEEDS IMPROVEMENT - High P95 latency';
    if (successRate >= 95 && avgResponseTime < 500) return '✅ EXCELLENT';
    if (successRate >= 90 && avgResponseTime < 1000) return '🟢 GOOD';
    return '🟡 FAIR - Some optimization needed';
  }

  generateFindings() {
    const findings = [];
    const metrics = this.results.metrics;

    if (metrics.successRate < 95) {
      findings.push(`- ⚠️ Success rate is ${Math.round(metrics.successRate)}% (target: >95%)`);
    }

    if (metrics.averageResponseTime > 200) {
      findings.push(`- ⚠️ Average response time is ${Math.round(metrics.averageResponseTime)}ms (target: <200ms)`);
    }

    if (metrics.p95 > 1000) {
      findings.push(`- ⚠️ P95 response time is ${Math.round(metrics.p95)}ms (target: <1000ms)`);
    }

    if (this.results.errors.length > 0) {
      findings.push(`- 🚨 Found ${this.results.errors.length} errors during testing`);
    }

    if (this.results.finalMemoryUsage.heapUsed > 100) {
      findings.push(`- ⚠️ High memory usage: ${this.results.finalMemoryUsage.heapUsed}MB heap`);
    }

    const maxConcurrentSuccess = this.results.concurrencyResults
      .filter(r => r.metrics.successRate > 90)
      .map(r => r.concurrentUsers)
      .pop() || 0;

    findings.push(`- 📊 System handles up to ${maxConcurrentSuccess} concurrent users with >90% success rate`);

    return findings.length > 0 ? findings.join('\n') : '- ✅ No major performance issues detected';
  }

  generateRecommendations() {
    const recommendations = [];
    const metrics = this.results.metrics;

    if (metrics.successRate < 95) {
      recommendations.push('- 🔧 Investigate and fix error causes to improve success rate');
    }

    if (metrics.averageResponseTime > 200) {
      recommendations.push('- ⚡ Implement caching to reduce response times');
      recommendations.push('- 🗄️ Optimize database queries and add indexes');
    }

    if (this.results.finalMemoryUsage.heapUsed > 100) {
      recommendations.push('- 🧠 Optimize memory usage and implement garbage collection tuning');
    }

    if (this.results.errors.length > 0) {
      recommendations.push('- 🔍 Review error logs and implement proper error handling');
    }

    recommendations.push('- 📈 Implement monitoring and alerting for production');
    recommendations.push('- 🔄 Set up load balancing for horizontal scaling');
    recommendations.push('- 💾 Implement Redis caching for frequently accessed data');

    return recommendations.join('\n');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new PerformanceTester();

  tester.runTestSuite()
    .then((results) => {
      logger.info('\n✅ Performance testing completed successfully!');
      logger.info(`\n📊 Summary: ${results.metrics.totalRequests} requests, ${Math.round(results.metrics.successRate)}% success rate`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Performance testing failed:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTester;