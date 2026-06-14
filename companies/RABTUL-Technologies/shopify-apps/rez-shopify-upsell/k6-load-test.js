/**
 * ReZ Upsell - k6 Load Tests
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  scenarios: {
    // Smoke test - light load
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
    // Load test - normal traffic
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 0 },
      ],
    },
    // Stress test - peak traffic
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
    // Spike test - sudden traffic
    spike: {
      executor: 'spike',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 200 },
        { duration: '2m', target: 10 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4102';

export default function () {
  const shop = 'load-test-store.myshopify.com';
  const sessionId = `session-${__VU}-${__ITER}`;

  // Test 1: Health check
  {
    const res = http.get(`${BASE_URL}/health`);
    const success = check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
    errorRate.add(!success);
    responseTime.add(res.timings.duration);
  }

  // Test 2: Get upsell offer
  {
    const payload = JSON.stringify({
      shop,
      cartItems: [
        { productId: 'p1', variantId: 'v1', title: 'Product 1', price: 999, quantity: 1 },
      ],
      sessionId,
    });

    const res = http.post(`${BASE_URL}/api/upsell/offer`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
      'offer endpoint status 200': (r) => r.status === 200,
      'offer response time < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!success);
    responseTime.add(res.timings.duration);
  }

  // Test 3: Track event
  {
    const payload = JSON.stringify({
      shop,
      sessionId,
      offerId: `offer-${__ITER}`,
      productId: 'p1',
      event: 'offer_shown',
      revenue: 0,
    });

    const res = http.post(`${BASE_URL}/api/upsell/track`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
      'track endpoint status 200': (r) => r.status === 200,
      'track response time < 100ms': (r) => r.timings.duration < 100,
    });
    errorRate.add(!success);
    responseTime.add(res.timings.duration);
  }

  // Test 4: Configure upsell (less frequent)
  if (__ITER % 10 === 0) {
    const payload = JSON.stringify({
      shop,
      products: [
        { productId: 'p1', variantId: 'v1', title: 'Product 1', price: 999 },
        { productId: 'p2', variantId: 'v2', title: 'Product 2', price: 1499 },
      ],
      discountPercentage: 10,
      position: 'checkout',
    });

    const res = http.post(`${BASE_URL}/api/upsell/configure`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });

    const success = check(res, {
      'configure status 200': (r) => r.status === 200,
      'configure response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!success);
    responseTime.add(res.timings.duration);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { metrics } = data;
  const duration = metrics.http_req_duration;

  let summary = '\n\n';
  summary += '='.repeat(60) + '\n';
  summary += '  LOAD TEST SUMMARY\n';
  summary += '='.repeat(60) + '\n\n';

  summary += `Total Requests:    ${metrics.http_reqs.values.count}\n`;
  summary += `Request Rate:      ${metrics.http_reqs.values.rate.toFixed(2)}/s\n`;
  summary += `Failed Requests:    ${metrics.http_req_failed.values.passes}\n`;
  summary += `Error Rate:        ${(metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

  summary += 'Response Times:\n';
  summary += `  Average:         ${duration.values.avg.toFixed(2)}ms\n`;
  summary += `  P50 (median):    ${duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += `  P95:            ${duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  P99:            ${duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `  Max:            ${duration.values.max.toFixed(2)}ms\n\n`;

  summary += '='.repeat(60) + '\n';

  return summary;
}
