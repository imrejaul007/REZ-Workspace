// ReZ Ride Load Test Script
// Run: k6 run k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.API_URL || 'http://localhost:4000';

// Custom metrics
const errorRate = new Rate('errors');
const rideCreationTime = new Trend('ride_creation_time');
const fareEstimateTime = new Trend('fare_estimate_time');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Stress test
    { duration: '5m', target: 200 },   // High load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
    ride_creation_time: ['p(95)<2000'], // 95% under 2s
  },
};

const users = [
  { phone: '919876500001', otp: '1234' },
  { phone: '919876500002', otp: '1234' },
  { phone: '919876500003', otp: '1234' },
];

export function setup() {
  // Create test users
  const tokens = [];

  for (const user of users) {
    // Request OTP
    const otpRes = http.post(`${BASE_URL}/api/auth/request-otp`,
      JSON.stringify({ phone: user.phone, type: 'login' }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Verify OTP
    const verifyRes = http.post(`${BASE_URL}/api/auth/verify-otp`,
      JSON.stringify({ phone: user.phone, otp: user.otp }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (verifyRes.status === 200) {
      const body = JSON.parse(verifyRes.body);
      tokens.push(body.token);
    }
  }

  return { tokens };
}

export default function(data) {
  const token = data.tokens[Math.floor(Math.random() * data.tokens.length)];
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // Test 1: Fare Estimate (High volume)
  const estimateStart = Date.now();
  const estimateRes = http.get(
    `${BASE_URL}/api/fares/estimate?pickupLat=12.9716&pickupLng=77.5946&dropLat=12.9356&dropLng=77.6245&vehicleType=cab`,
    { headers }
  );
  fareEstimateTime.add(Date.now() - estimateStart);

  check(estimateRes, {
    'estimate status 200': (r) => r.status === 200,
    'estimate has fare': (r) => JSON.parse(r.body).estimate?.total > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Ride Creation (Core flow)
  const rideStart = Date.now();
  const rideRes = http.post(
    `${BASE_URL}/api/rides`,
    JSON.stringify({
      pickup: { lat: 12.9716, lng: 77.5946, address: 'MG Road, Bangalore' },
      drop: { lat: 12.9356, lng: 77.6245, address: 'Koramangala, Bangalore' },
      vehicleType: 'cab',
      paymentMethod: 'wallet',
    }),
    { headers }
  );
  rideCreationTime.add(Date.now() - rideStart);

  const rideOk = check(rideRes, {
    'ride status 200/201': (r) => r.status === 200 || r.status === 201,
    'ride has id': (r) => JSON.parse(r.body).ride?.id,
    'ride has fare': (r) => JSON.parse(r.body).ride?.fare?.total > 0,
  }) || errorRate.add(1);

  if (rideOk) {
    const rideId = JSON.parse(rideRes.body).ride?.id;

    sleep(1);

    // Test 3: Get Ride Details
    const getRes = http.get(`${BASE_URL}/api/rides/${rideId}`, { headers });
    check(getRes, {
      'get ride status 200': (r) => r.status === 200,
    }) || errorRate.add(1);

    // Test 4: Cancel Ride
    const cancelRes = http.post(
      `${BASE_URL}/api/rides/${rideId}/cancel`,
      JSON.stringify({ reason: 'Load test cancellation' }),
      { headers }
    );
    check(cancelRes, {
      'cancel status 200': (r) => r.status === 200,
    }) || errorRate.add(1);
  }

  sleep(1);

  // Test 5: Compare Fares
  const compareRes = http.get(
    `${BASE_URL}/api/fares/compare?pickupLat=12.9716&pickupLng=77.5946&dropLat=12.9356&dropLng=77.6245`,
    { headers }
  );
  check(compareRes, {
    'compare status 200': (r) => r.status === 200,
    'compare has estimates': (r) => JSON.parse(r.body).estimates?.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: Surge Check
  const surgeRes = http.get(`${BASE_URL}/api/surge/12.9716/77.5946`);
  check(surgeRes, {
    'surge status 200': (r) => r.status === 200,
  }) || errorRate.add(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const { metrics } = data;

  let summary = '\n';
  summary += '='.repeat(60) + '\n';
  summary += '  REZ RIDE LOAD TEST RESULTS\n';
  summary += '='.repeat(60) + '\n\n';

  summary += `Total Requests:     ${metrics.http_reqs.values.count}\n`;
  summary += `Request Duration:    ${metrics.http_req_duration.values.mean}ms (mean)\n`;
  summary += `Request Duration:    ${metrics.http_req_duration.values['p(95)']}ms (p95)\n`;
  summary += `Failed Requests:     ${metrics.http_req_failed.values.pass} (${(metrics.http_req_failed.values.rate * 100).toFixed(2)}%)\n\n`;

  summary += 'Custom Metrics:\n';
  summary += '-'.repeat(40) + '\n';
  summary += `Ride Creation:      ${metrics.ride_creation_time.values.mean}ms (mean)\n`;
  summary += `Fare Estimate:      ${metrics.fare_estimate_time.values.mean}ms (mean)\n\n`;

  summary += 'Checks Passed:      ' + (data.passes || 0) + '\n';
  summary += 'Checks Failed:      ' + (data.failures || 0) + '\n';

  return summary;
}
