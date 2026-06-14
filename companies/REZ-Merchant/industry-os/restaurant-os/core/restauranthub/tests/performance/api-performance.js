import logger from './utils/logger';

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const jobCreationDuration = new Trend('job_creation_duration');
const userRegistrationDuration = new Trend('user_registration_duration');

// Test configuration based on environment
const getTestConfig = () => {
  const testType = __ENV.TEST_TYPE || 'load';

  const configs = {
    smoke: {
      stages: [
        { duration: '1m', target: 1 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
      },
    },
    load: {
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 0 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<500'],
        http_req_failed: ['rate<0.1'],
        errors: ['rate<0.1'],
      },
    },
    stress: {
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 30 },
        { duration: '5m', target: 30 },
        { duration: '2m', target: 40 },
        { duration: '5m', target: 40 },
        { duration: '10m', target: 0 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed: ['rate<0.2'],
        errors: ['rate<0.2'],
      },
    },
    spike: {
      stages: [
        { duration: '1m', target: 10 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 10 },
        { duration: '1m', target: 0 },
      ],
      thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.3'],
        errors: ['rate<0.3'],
      },
    },
  };

  return configs[testType] || configs.load;
};

export const options = getTestConfig();

// Test data generators
const generateUser = () => ({
  email: `testuser${Math.random().toString(36).substr(2, 9)}@example.com`,
  password: 'TestPassword123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'CUSTOMER',
});

const generateRestaurant = () => ({
  name: `Test Restaurant ${Math.random().toString(36).substr(2, 9)}`,
  description: 'A test restaurant for performance testing',
  address: '123 Test Street',
  city: 'Test City',
  state: 'TS',
  country: 'Test Country',
  pincode: '12345',
  phone: '+1987654321',
  email: `restaurant${Math.random().toString(36).substr(2, 9)}@example.com`,
  cuisineType: ['Italian', 'American'],
});

const generateJob = () => ({
  title: `Test Job ${Math.random().toString(36).substr(2, 9)}`,
  description: 'A test job posting for performance testing',
  requirements: ['Experience required', 'Team player'],
  skills: ['Communication', 'Time Management'],
  experienceMin: 1,
  experienceMax: 5,
  salaryMin: 30000,
  salaryMax: 50000,
  location: 'Test City, TS',
  jobType: 'Full-time',
  validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
});

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

// Global variables for authenticated requests
let authToken = '';
let userId = '';
let restaurantId = '';

export function setup() {
  // Create admin user for setup
  const adminUser = {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  };

  const signupResponse = http.post(`${BASE_URL}/auth/signup`, JSON.stringify(adminUser), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (signupResponse.status === 201 || signupResponse.status === 409) {
    // Try to login
    const loginResponse = http.post(`${BASE_URL}/auth/signin`, JSON.stringify({
      email: adminUser.email,
      password: adminUser.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (loginResponse.status === 200) {
      const loginData = JSON.parse(loginResponse.body);
      return {
        adminToken: loginData.accessToken,
        adminUserId: loginData.user.id,
      };
    }
  }

  logger.info('Setup failed - proceeding without admin token');
  return {};
}

export default function (data) {
  const testScenarios = [
    () => testHealthCheck(),
    () => testUserRegistration(),
    () => testUserAuthentication(),
    () => testJobsEndpoint(),
    () => testRestaurantsEndpoint(),
    () => testSearchFunctionality(),
  ];

  // Randomly select a test scenario
  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  scenario();

  sleep(1);
}

function testHealthCheck() {
  const response = http.get(`${BASE_URL}/health`);

  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(response.status !== 200);
}

function testUserRegistration() {
  const user = generateUser();
  const startTime = new Date();

  const response = http.post(`${BASE_URL}/auth/signup`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  const duration = new Date() - startTime;
  userRegistrationDuration.add(duration);

  const success = check(response, {
    'user registration status is 201': (r) => r.status === 201,
    'user registration response time < 1000ms': (r) => r.timings.duration < 1000,
    'user registration returns access token': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.accessToken && data.accessToken.length > 0;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success || response.status !== 201);

  // Store token for subsequent requests
  if (response.status === 201) {
    const responseData = JSON.parse(response.body);
    authToken = responseData.accessToken;
    userId = responseData.user.id;
  }
}

function testUserAuthentication() {
  const user = generateUser();

  // First register a user
  const signupResponse = http.post(`${BASE_URL}/auth/signup`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (signupResponse.status === 201) {
    const startTime = new Date();

    // Then authenticate
    const loginResponse = http.post(`${BASE_URL}/auth/signin`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const duration = new Date() - startTime;
    authDuration.add(duration);

    const success = check(loginResponse, {
      'authentication status is 200': (r) => r.status === 200,
      'authentication response time < 500ms': (r) => r.timings.duration < 500,
      'authentication returns valid token': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.accessToken && data.user && data.user.id;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success || loginResponse.status !== 200);

    if (loginResponse.status === 200) {
      const loginData = JSON.parse(loginResponse.body);
      authToken = loginData.accessToken;
      userId = loginData.user.id;
    }
  }
}

function testJobsEndpoint() {
  // Test getting jobs list
  const jobsResponse = http.get(`${BASE_URL}/jobs?page=1&limit=10`);

  const success = check(jobsResponse, {
    'jobs list status is 200': (r) => r.status === 200,
    'jobs list response time < 500ms': (r) => r.timings.duration < 500,
    'jobs list returns array': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.jobs);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success || jobsResponse.status !== 200);

  // If we have auth token, test creating a job
  if (authToken) {
    testJobCreation();
  }
}

function testJobCreation() {
  // First create a restaurant
  const restaurant = generateRestaurant();
  const restaurantResponse = http.post(`${BASE_URL}/restaurants`, JSON.stringify(restaurant), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  });

  if (restaurantResponse.status === 201) {
    const restaurantData = JSON.parse(restaurantResponse.body);
    restaurantId = restaurantData.id;

    // Then create a job
    const job = generateJob();
    const startTime = new Date();

    const jobResponse = http.post(`${BASE_URL}/jobs`, JSON.stringify(job), {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const duration = new Date() - startTime;
    jobCreationDuration.add(duration);

    const success = check(jobResponse, {
      'job creation status is 201': (r) => r.status === 201,
      'job creation response time < 1000ms': (r) => r.timings.duration < 1000,
      'job creation returns job id': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.id && data.title === job.title;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success || jobResponse.status !== 201);
  }
}

function testRestaurantsEndpoint() {
  const response = http.get(`${BASE_URL}/restaurants?page=1&limit=10`);

  const success = check(response, {
    'restaurants list status is 200': (r) => r.status === 200,
    'restaurants list response time < 500ms': (r) => r.timings.duration < 500,
    'restaurants list returns pagination': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.restaurants && data.pagination;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success || response.status !== 200);
}

function testSearchFunctionality() {
  const searchQueries = ['chef', 'server', 'manager', 'cook', 'waiter'];
  const query = searchQueries[Math.floor(Math.random() * searchQueries.length)];

  const response = http.get(`${BASE_URL}/jobs?search=${query}&page=1&limit=10`);

  const success = check(response, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 800ms': (r) => r.timings.duration < 800,
    'search returns valid results': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.jobs && Array.isArray(data.jobs);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success || response.status !== 200);
}

export function teardown(data) {
  // Cleanup any test data if needed
  logger.info('Performance test completed');
}

// Helper function to handle errors gracefully
function handleError(response, context) {
  if (response.status >= 400) {
    logger.info(`Error in ${context}: ${response.status} - ${response.body}`);
  }
}

export { errorRate, authDuration, jobCreationDuration, userRegistrationDuration };