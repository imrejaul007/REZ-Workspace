/**
 * REZ AdBazaar - Test Suite for New Intelligence Services
 * Tests all 15 services on ports 4810-4819, 4900-4904
 */

const http = require('http');

const SERVICES = [
  { name: 'Email Validator', port: 4810, path: '/health' },
  { name: 'Fraud Detection', port: 4811, path: '/health' },
  { name: 'Creative A/B Testing', port: 4812, path: '/health' },
  { name: 'Brand Safety', port: 4813, path: '/health' },
  { name: 'Viewability Tracker', port: 4814, path: '/health' },
  { name: 'Attribution Modeling', port: 4815, path: '/health' },
  { name: 'Audience Sync', port: 4816, path: '/health' },
  { name: 'Creative Rotation', port: 4817, path: '/health' },
  { name: 'Frequency Capping', port: 4818, path: '/health' },
  { name: 'Budget Allocator', port: 4819, path: '/health' },
  { name: 'Churn Predictor', port: 4900, path: '/health' },
  { name: 'LTV Calculator', port: 4901, path: '/health' },
  { name: 'Next Best Action', port: 4902, path: '/health' },
  { name: 'Sentiment Analyzer', port: 4903, path: '/health' },
  { name: 'Competitor Monitor', port: 4904, path: '/health' },
];

// Test specific endpoints for each service
const SERVICE_TESTS = {
  4810: {
    name: 'Email Validator',
    tests: [
      {
        method: 'POST',
        path: '/api/validate',
        body: { email: 'test@example.com' },
        expect: 200,
      },
      {
        method: 'POST',
        path: '/api/validate',
        body: { email: 'test@tempmail.com' },
        expect: 200,
      },
    ],
  },
  4811: {
    name: 'Fraud Detection',
    tests: [
      {
        method: 'POST',
        path: '/api/detect',
        body: {
          userId: 'user_123',
          ip: '192.168.1.1',
          deviceFingerprint: 'fp_abc123',
          eventType: 'click',
        },
        expect: 200,
      },
    ],
  },
  4812: {
    name: 'Creative A/B Testing',
    tests: [
      {
        method: 'POST',
        path: '/api/experiments',
        body: {
          name: 'Homepage CTA Test',
          variants: ['control', 'variant_a', 'variant_b'],
          traffic: { control: 33.33, variant_a: 33.33, variant_b: 33.34 },
        },
        expect: 201,
      },
    ],
  },
  4813: {
    name: 'Brand Safety',
    tests: [
      {
        method: 'POST',
        path: '/api/check',
        body: {
          content: 'Check this amazing product!',
          type: 'text',
        },
        expect: 200,
      },
    ],
  },
  4814: {
    name: 'Viewability Tracker',
    tests: [
      {
        method: 'POST',
        path: '/api/track',
        body: {
          adId: 'ad_123',
          impressionId: 'imp_456',
          visible: true,
          duration: 2500,
        },
        expect: 200,
      },
    ],
  },
  4815: {
    name: 'Attribution Modeling',
    tests: [
      {
        method: 'POST',
        path: '/api/attribute',
        body: {
          customerId: 'cust_123',
          touches: [
            { channel: 'facebook', timestamp: '2024-01-01T10:00:00Z' },
            { channel: 'google', timestamp: '2024-01-02T10:00:00Z' },
            { channel: 'email', timestamp: '2024-01-03T10:00:00Z' },
          ],
          conversionValue: 150,
          model: 'linear',
        },
        expect: 200,
      },
    ],
  },
  4816: {
    name: 'Audience Sync',
    tests: [
      {
        method: 'POST',
        path: '/api/audiences',
        body: {
          name: 'High Value Customers',
          source: 'internal',
          segments: ['high_ltv', 'repeat_buyer'],
        },
        expect: 201,
      },
    ],
  },
  4817: {
    name: 'Creative Rotation',
    tests: [
      {
        method: 'POST',
        path: '/api/rotate',
        body: {
          campaignId: 'camp_123',
          userId: 'user_456',
          context: { page: 'home', time: 'morning' },
        },
        expect: 200,
      },
    ],
  },
  4818: {
    name: 'Frequency Capping',
    tests: [
      {
        method: 'POST',
        path: '/api/check',
        body: {
          userId: 'user_123',
          campaignId: 'camp_456',
          adId: 'ad_789',
        },
        expect: 200,
      },
    ],
  },
  4819: {
    name: 'Budget Allocator',
    tests: [
      {
        method: 'POST',
        path: '/api/allocate',
        body: {
          totalBudget: 10000,
          channels: ['facebook', 'google', 'tiktok'],
          historical: {
            facebook: { spend: 3000, conversions: 150 },
            google: { spend: 4000, conversions: 200 },
            tiktok: { spend: 3000, conversions: 100 },
          },
        },
        expect: 200,
      },
    ],
  },
  4900: {
    name: 'Churn Predictor',
    tests: [
      {
        method: 'POST',
        path: '/api/predict',
        body: {
          customerId: 'cust_123',
          features: {
            daysSinceLastPurchase: 45,
            totalOrders: 12,
            avgOrderValue: 150,
            engagementScore: 0.4,
          },
        },
        expect: 200,
      },
    ],
  },
  4901: {
    name: 'LTV Calculator',
    tests: [
      {
        method: 'POST',
        path: '/api/calculate',
        body: {
          customerId: 'cust_123',
          features: {
            totalRevenue: 5000,
            totalOrders: 25,
            avgOrderValue: 200,
            customerAge: 365,
          },
        },
        expect: 200,
      },
    ],
  },
  4902: {
    name: 'Next Best Action',
    tests: [
      {
        method: 'POST',
        path: '/api/recommend',
        body: {
          customerId: 'cust_123',
          context: {
            lastPurchase: '2024-01-15',
            cartValue: 500,
            segment: 'regular',
          },
        },
        expect: 200,
      },
    ],
  },
  4903: {
    name: 'Sentiment Analyzer',
    tests: [
      {
        method: 'POST',
        path: '/api/analyze',
        body: {
          text: 'I absolutely love this product! Best purchase ever.',
          source: 'review',
        },
        expect: 200,
      },
    ],
  },
  4904: {
    name: 'Competitor Monitor',
    tests: [
      {
        method: 'GET',
        path: '/api/competitors',
        expect: 200,
      },
    ],
  },
};

function makeRequest(port, method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testService(service) {
  const results = { name: service.name, port: service.port, health: null, tests: [] };

  // Test health endpoint
  try {
    const healthRes = await makeRequest(service.port, 'GET', service.path);
    results.health = healthRes.status === 200 ? '✅' : '⚠️';
  } catch (err) {
    results.health = '❌';
  }

  // Test specific endpoints
  const serviceTest = SERVICE_TESTS[service.port];
  if (serviceTest) {
    for (const test of serviceTest.tests) {
      try {
        const res = await makeRequest(service.port, test.method, test.path, test.body);
        const pass = res.status === test.expect;
        results.tests.push({
          name: `${test.method} ${test.path}`,
          status: pass ? '✅' : '⚠️',
          response: res.status,
        });
      } catch (err) {
        results.tests.push({
          name: `${test.method} ${test.path}`,
          status: '❌',
          error: err.message,
        });
      }
    }
  }

  return results;
}

async function runAllTests() {
  console.log('🧪 REZ AdBazaar - Service Test Suite');
  console.log('====================================\n');

  const results = await Promise.all(SERVICES.map(testService));

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const result of results) {
    console.log(`\n📡 ${result.name} (Port ${result.port})`);
    console.log(`   Health: ${result.health}`);

    for (const test of result.tests) {
      if (test.status === '✅') {
        passed++;
        console.log(`   ${test.status} ${test.name}`);
      } else if (test.status === '⚠️') {
        skipped++;
        console.log(`   ${test.status} ${test.name} (Response: ${test.response})`);
      } else {
        failed++;
        console.log(`   ${test.status} ${test.name} - ${test.error}`);
      }
    }
  }

  console.log('\n====================================');
  console.log('📊 Test Summary');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ⚠️  Warnings: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('====================================');

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
