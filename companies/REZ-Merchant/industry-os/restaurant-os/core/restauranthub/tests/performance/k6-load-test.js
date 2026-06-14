import logger from './utils/logger';

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const authFailureRate = new Rate('auth_failures');
const apiResponseTime = new Trend('api_response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp up to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '3m', target: 0 },    // Ramp down
  ],

  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'], // 95% under 2s, 99% under 3s
    http_req_failed: ['rate<0.05'], // Less than 5% failure rate
    auth_failures: ['rate<0.02'],    // Less than 2% auth failures
    api_response_time: ['p(95)<1500'], // 95% of API calls under 1.5s
    http_reqs: ['rate>100'],          // More than 100 req/s
  },

  // Test data
  env: {
    BASE_URL: __ENV.BASE_URL || 'http://localhost:3000',
    ADMIN_EMAIL: __ENV.ADMIN_EMAIL || 'admin@restopapa.com',
    ADMIN_PASSWORD: __ENV.ADMIN_PASSWORD || 'Password123',
  }
};

// Global variables
let authToken = null;
const baseUrl = `${__ENV.BASE_URL}/api/v1`;

// Test data pool
const testData = {
  restaurants: [
    { id: 'rest-1', name: 'Pizza Palace' },
    { id: 'rest-2', name: 'Burger Barn' },
    { id: 'rest-3', name: 'Sushi Spot' }
  ],
  jobs: [
    { id: 'job-1', title: 'Chef Position' },
    { id: 'job-2', title: 'Server Role' },
    { id: 'job-3', title: 'Manager Position' }
  ],
  searchTerms: ['chef', 'server', 'manager', 'cook', 'waiter'],
  locations: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']
};

// Authentication function
function authenticate() {
  const loginPayload = {
    email: __ENV.ADMIN_EMAIL,
    password: __ENV.ADMIN_PASSWORD
  };

  const response = http.post(`${baseUrl}/auth/signin`, JSON.stringify(loginPayload), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'auth_signin' }
  });

  const authSuccess = check(response, {
    'auth: status is 200': (r) => r.status === 200,
    'auth: has access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken && body.accessToken.length > 0;
      } catch (e) {
        return false;
      }
    },
    'auth: response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  authFailureRate.add(!authSuccess);
  apiResponseTime.add(response.timings.duration);

  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      return body.accessToken;
    } catch (e) {
      console.error('Failed to parse auth response:', e);
      return null;
    }
  }

  return null;
}

// Main test function
export default function () {
  // Authenticate if we don't have a token
  if (!authToken) {
    authToken = authenticate();
    if (!authToken) {
      logger.error('Authentication failed, skipping test iteration');
      return;
    }
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  group('Health Checks', () => {
    // Basic health check
    const healthResponse = http.get(`${baseUrl}/auth/health`, {
      tags: { name: 'health_check' }
    });

    check(healthResponse, {
      'health: status is 200': (r) => r.status === 200,
      'health: response time < 500ms': (r) => r.timings.duration < 500,
      'health: status is ok': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'ok';
        } catch (e) {
          return false;
        }
      }
    });

    // Redis health check
    const redisHealthResponse = http.get(`${baseUrl}/auth/redis-health`, {
      tags: { name: 'redis_health_check' }
    });

    check(redisHealthResponse, {
      'redis health: status is 200': (r) => r.status === 200,
      'redis health: response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    apiResponseTime.add(healthResponse.timings.duration);
    apiResponseTime.add(redisHealthResponse.timings.duration);
  });

  group('Restaurant Operations', () => {
    // List restaurants
    const restaurantsResponse = http.get(`${baseUrl}/restaurants`, {
      headers,
      tags: { name: 'list_restaurants' }
    });

    check(restaurantsResponse, {
      'restaurants: status is 200': (r) => r.status === 200,
      'restaurants: response time < 2000ms': (r) => r.timings.duration < 2000,
      'restaurants: returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body) || (body.data && Array.isArray(body.data));
        } catch (e) {
          return false;
        }
      }
    });

    // Get specific restaurant
    const randomRestaurant = testData.restaurants[Math.floor(Math.random() * testData.restaurants.length)];
    const restaurantResponse = http.get(`${baseUrl}/restaurants/${randomRestaurant.id}`, {
      headers,
      tags: { name: 'get_restaurant' }
    });

    check(restaurantResponse, {
      'restaurant detail: status is 200 or 404': (r) => r.status === 200 || r.status === 404,
      'restaurant detail: response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    apiResponseTime.add(restaurantsResponse.timings.duration);
    apiResponseTime.add(restaurantResponse.timings.duration);
  });

  group('Job Portal Operations', () => {
    // List jobs
    const jobsResponse = http.get(`${baseUrl}/jobs?page=1&limit=20`, {
      headers,
      tags: { name: 'list_jobs' }
    });

    check(jobsResponse, {
      'jobs: status is 200': (r) => r.status === 200,
      'jobs: response time < 2000ms': (r) => r.timings.duration < 2000,
      'jobs: returns paginated data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data);
        } catch (e) {
          return false;
        }
      }
    });

    // Search jobs
    const randomSearchTerm = testData.searchTerms[Math.floor(Math.random() * testData.searchTerms.length)];
    const randomLocation = testData.locations[Math.floor(Math.random() * testData.locations.length)];

    const searchResponse = http.get(`${baseUrl}/jobs/search?q=${randomSearchTerm}&location=${randomLocation}`, {
      headers,
      tags: { name: 'search_jobs' }
    });

    check(searchResponse, {
      'job search: status is 200': (r) => r.status === 200,
      'job search: response time < 2000ms': (r) => r.timings.duration < 2000,
      'job search: returns results': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body);
        } catch (e) {
          return false;
        }
      }
    });

    apiResponseTime.add(jobsResponse.timings.duration);
    apiResponseTime.add(searchResponse.timings.duration);
  });

  group('User Profile Operations', () => {
    // Get current user profile
    const profileResponse = http.get(`${baseUrl}/auth/me`, {
      headers,
      tags: { name: 'get_profile' }
    });

    check(profileResponse, {
      'profile: status is 200': (r) => r.status === 200,
      'profile: response time < 1000ms': (r) => r.timings.duration < 1000,
      'profile: has user data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id && body.email;
        } catch (e) {
          return false;
        }
      }
    });

    // Get user stats
    const statsResponse = http.get(`${baseUrl}/users/stats`, {
      headers,
      tags: { name: 'get_user_stats' }
    });

    check(statsResponse, {
      'user stats: status is 200': (r) => r.status === 200,
      'user stats: response time < 1500ms': (r) => r.timings.duration < 1500,
    });

    apiResponseTime.add(profileResponse.timings.duration);
    apiResponseTime.add(statsResponse.timings.duration);
  });

  // Random delay to simulate real user behavior
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

// Setup function - runs once per VU
export function setup() {
  logger.info('Starting RestoPapa performance test...');
  logger.info(`Target URL: ${baseUrl}`);
  logger.info(`Test duration: ~20 minutes`);

  // Verify the API is accessible
  const healthCheck = http.get(`${baseUrl}/auth/health`);
  if (healthCheck.status !== 200) {
    logger.error('API health check failed. Make sure the server is running.');
    return null;
  }

  return { baseUrl };
}

// Teardown function - runs once after all VUs
export function teardown(data) {
  logger.info('Performance test completed');
}

// Handle different test scenarios
export const scenarios = {
  // Regular load test
  load_test: {
    executor: 'ramping-vus',
    exec: 'default',
    stages: options.stages,
    gracefulRampDown: '30s',
  },

  // Spike test - sudden load increase
  spike_test: {
    executor: 'ramping-vus',
    startTime: '10m',
    stages: [
      { duration: '10s', target: 500 }, // Sudden spike
      { duration: '1m', target: 500 },  // Hold the spike
      { duration: '10s', target: 50 },  // Quick ramp down
    ],
    gracefulRampDown: '30s',
  },

  // Stress test - find breaking point
  stress_test: {
    executor: 'ramping-vus',
    startTime: '15m',
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 400 },
      { duration: '5m', target: 400 },
      { duration: '2m', target: 600 },
      { duration: '5m', target: 600 },
      { duration: '2m', target: 0 },
    ],
    gracefulRampDown: '30s',
  }
};