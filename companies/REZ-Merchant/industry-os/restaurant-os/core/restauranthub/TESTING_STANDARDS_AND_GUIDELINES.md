# Testing Standards & Guidelines for RestoPapa

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Testing Frameworks & Tools](#testing-frameworks--tools)
4. [Test Types & Structure](#test-types--structure)
5. [Code Coverage Requirements](#code-coverage-requirements)
6. [Testing Best Practices](#testing-best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Quality Gates](#quality-gates)
9. [Test Data Management](#test-data-management)
10. [Performance Testing](#performance-testing)
11. [Security Testing](#security-testing)
12. [Maintenance & Updates](#maintenance--updates)

## Overview

This document outlines the comprehensive testing standards and guidelines for the RestoPapa platform. Our testing strategy ensures high code quality, system reliability, and confident deployments across all modules.

### Testing Philosophy

- **Test-Driven Development (TDD)**: Write tests before implementation
- **Quality First**: Maintain high test coverage and quality standards
- **Fail Fast**: Catch issues early in the development cycle
- **Automation**: Automate all testing processes in CI/CD pipeline
- **Documentation**: Maintain clear, comprehensive test documentation

## Testing Strategy

### Test Pyramid

```
     E2E Tests (10%)
       /       \
  Integration Tests (20%)
    /               \
Unit Tests (70%)
```

### Coverage Targets

| Module | Unit Tests | Integration Tests | E2E Tests | Overall Target |
|--------|------------|-------------------|-----------|----------------|
| Authentication | 90% | 85% | 80% | 90% |
| Jobs Management | 85% | 80% | 75% | 85% |
| User Management | 85% | 80% | 75% | 85% |
| Restaurants | 80% | 75% | 70% | 80% |
| Database Layer | 90% | 85% | N/A | 90% |
| Web Components | 75% | 70% | 70% | 75% |
| API Endpoints | 85% | 90% | 80% | 85% |

## Testing Frameworks & Tools

### Backend (API)

- **Jest**: Primary testing framework
- **Supertest**: HTTP assertion library for API testing
- **Prisma**: Database testing with test database
- **@nestjs/testing**: NestJS testing utilities
- **@faker-js/faker**: Test data generation

### Frontend (Web)

- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **Playwright**: End-to-end testing
- **MSW (Mock Service Worker)**: API mocking
- **@testing-library/jest-dom**: Custom Jest matchers

### Database

- **Prisma Client**: Database operations testing
- **PostgreSQL**: Test database instance
- **Redis**: In-memory data structure testing

### CI/CD

- **GitHub Actions**: Automated testing pipeline
- **Codecov**: Code coverage reporting
- **Semgrep**: Static analysis security testing
- **Snyk**: Dependency vulnerability scanning

## Test Types & Structure

### 1. Unit Tests

**Purpose**: Test individual functions, methods, and components in isolation.

**Location**:
- API: `/apps/api/test/unit/`
- Web: `/apps/web/__tests__/`

**Naming Convention**: `*.spec.ts` or `*.test.ts`

**Structure**:
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: MockDependency;

  beforeEach(async () => {
    // Setup test module
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error cases', async () => {
      // Test error scenarios
    });
  });
});
```

### 2. Integration Tests

**Purpose**: Test the interaction between multiple components, modules, or services.

**Location**: `/apps/api/test/integration/`

**Structure**:
```typescript
describe('Module Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup test application
  });

  afterAll(async () => {
    // Cleanup application
  });

  beforeEach(async () => {
    // Reset test data
  });

  describe('API Endpoint Tests', () => {
    it('should handle complete workflow', async () => {
      // Test full request-response cycle
    });
  });
});
```

### 3. End-to-End Tests

**Purpose**: Test complete user workflows from frontend to backend.

**Location**: `/apps/web/e2e/`

**Structure**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test('should allow user to sign up and login', async ({ page }) => {
    // Navigate to signup
    // Fill form
    // Submit
    // Verify success
    // Test login
  });
});
```

### 4. Database Tests

**Purpose**: Test database operations, migrations, and data integrity.

**Location**: `/apps/api/test/database/`

**Focus Areas**:
- CRUD operations
- Data relationships
- Constraints validation
- Migration testing
- Performance testing

## Code Coverage Requirements

### Minimum Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  './src/modules/auth/**/*.ts': {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90,
  },
  './src/modules/jobs/**/*.ts': {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

### Coverage Exclusions

- Configuration files (`*.config.js`, `*.config.ts`)
- Test files (`*.test.ts`, `*.spec.ts`)
- Type definitions (`*.d.ts`)
- Module files (`*.module.ts`)
- DTO files (`*.dto.ts`)
- Interface files (`*.interface.ts`)
- Main entry points (`main.ts`)

## Testing Best Practices

### 1. Test Naming

```typescript
// ✅ Good
it('should create user when valid data is provided', () => {});
it('should throw ValidationError when email is invalid', () => {});

// ❌ Bad
it('should work', () => {});
it('test user creation', () => {});
```

### 2. Test Structure (AAA Pattern)

```typescript
it('should calculate total with tax', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // Act
  const result = calculateTotal(items, taxRate);

  // Assert
  expect(result).toBe(330);
});
```

### 3. Test Independence

```typescript
// ✅ Good - Each test is independent
describe('UserService', () => {
  beforeEach(() => {
    // Fresh setup for each test
  });

  it('should create user', () => {
    // Test logic
  });

  it('should update user', () => {
    // Test logic - doesn't depend on previous test
  });
});
```

### 4. Mock External Dependencies

```typescript
const mockEmailService = {
  sendEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});
```

### 5. Test Error Cases

```typescript
it('should handle database connection failure', async () => {
  mockPrisma.user.create.mockRejectedValue(
    new Error('Database connection failed')
  );

  await expect(userService.createUser(userData))
    .rejects.toThrow('Database connection failed');
});
```

### 6. Use Test Factories

```typescript
// Use factories for consistent test data
const user = TestFactories.createUser({
  email: 'specific@example.com',
  role: UserRole.ADMIN,
});
```

## CI/CD Integration

### Automated Testing Pipeline

1. **Code Quality Checks**
   - TypeScript compilation
   - ESLint analysis
   - Prettier formatting
   - Security audit

2. **Unit Tests**
   - Run unit tests with coverage
   - Upload coverage reports
   - Enforce coverage thresholds

3. **Integration Tests**
   - Start test services (PostgreSQL, Redis)
   - Run integration tests
   - Generate integration coverage

4. **E2E Tests**
   - Build applications
   - Start test servers
   - Run Playwright tests
   - Capture screenshots/videos

5. **Performance Tests**
   - Run performance benchmarks
   - Generate performance reports
   - Compare against baselines

6. **Security Tests**
   - Static analysis with Semgrep
   - Dependency vulnerability scanning
   - OWASP security checks

### Pipeline Triggers

- **Push to main/develop**: Full test suite
- **Pull requests**: Relevant test suites based on changes
- **Scheduled**: Daily full test suite with performance tests
- **Manual**: On-demand testing with specific flags

## Quality Gates

### Blocking Conditions

Tests must pass these gates before deployment:

1. **Unit Test Coverage**: >= 80% overall, >= 90% for critical modules
2. **Integration Test Pass Rate**: >= 95%
3. **E2E Test Pass Rate**: >= 90%
4. **Performance Regression**: < 10% performance degradation
5. **Security Vulnerabilities**: No high/critical vulnerabilities
6. **Code Quality**: ESLint score >= 95%

### Non-Blocking Warnings

- Medium-severity security vulnerabilities
- Performance degradation 5-10%
- Code coverage 75-80%
- E2E test pass rate 85-90%

## Test Data Management

### Test Database Strategy

```typescript
// Setup clean database for each test suite
beforeAll(async () => {
  await TestUtils.cleanupDatabase(prisma);
  await TestUtils.seedTestData(prisma);
});

afterAll(async () => {
  await TestUtils.cleanupDatabase(prisma);
});
```

### Test Data Factories

```typescript
// Use factories for consistent, realistic test data
export class TestFactories {
  static createUser(overrides = {}) {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      passwordHash: faker.string.alphanumeric(60),
      role: faker.helpers.arrayElement(['CUSTOMER', 'RESTAURANT']),
      ...overrides,
    };
  }
}
```

### Data Isolation

- Use transactions for database tests
- Create unique test data for each test
- Clean up test data after each test
- Use separate test database

## Performance Testing

### Performance Test Categories

1. **Load Testing**: Normal expected load
2. **Stress Testing**: Beyond normal capacity
3. **Spike Testing**: Sudden load increases
4. **Endurance Testing**: Extended periods

### Performance Metrics

- **Response Time**: 95th percentile < 500ms
- **Throughput**: > 1000 requests/second
- **Error Rate**: < 1%
- **Resource Usage**: CPU < 80%, Memory < 80%

### Performance Test Implementation

```typescript
describe('Performance Tests', () => {
  it('should handle concurrent user requests', async () => {
    const concurrentRequests = 100;
    const startTime = Date.now();

    const promises = Array.from({ length: concurrentRequests }, () =>
      request(app).get('/api/users').expect(200)
    );

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

## Security Testing

### Security Test Areas

1. **Authentication & Authorization**
2. **Input Validation & Sanitization**
3. **SQL Injection Prevention**
4. **XSS Protection**
5. **CSRF Protection**
6. **Rate Limiting**
7. **Data Encryption**

### Security Test Implementation

```typescript
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";

    const response = await request(app)
      .post('/api/users')
      .send({ name: maliciousInput })
      .expect(400);

    // Verify database integrity
    const users = await prisma.user.findMany();
    expect(users).toBeDefined();
  });

  it('should sanitize XSS attempts', async () => {
    const xssPayload = '<script>alert("xss")</script>';

    const response = await request(app)
      .post('/api/users')
      .send({ bio: xssPayload })
      .expect(201);

    expect(response.body.bio).not.toContain('<script>');
  });
});
```

## Maintenance & Updates

### Regular Maintenance Tasks

1. **Weekly**:
   - Review failed tests and flaky tests
   - Update test dependencies
   - Check coverage reports

2. **Monthly**:
   - Review and update test strategies
   - Performance baseline updates
   - Security vulnerability assessments

3. **Quarterly**:
   - Testing framework updates
   - Test suite optimization
   - Coverage target reviews

### Test Debugging

```bash
# Run specific test file
npm run test -- auth.service.spec.ts

# Run tests with debug information
npm run test:debug

# Run tests with coverage
npm run test:cov

# Run only failed tests
npm run test -- --onlyFailures

# Run tests in watch mode
npm run test:watch
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Flaky tests | Add proper waits, improve test isolation |
| Slow tests | Optimize database operations, use mocks |
| Memory leaks | Proper cleanup in afterEach/afterAll |
| Test pollution | Reset mocks, clean test data |
| Coverage gaps | Add tests for uncovered branches |

## Reporting & Monitoring

### Test Reports

- **Coverage Reports**: Generated by Jest and uploaded to Codecov
- **Test Results**: XML format for CI/CD integration
- **Performance Reports**: JSON format with metrics
- **Security Reports**: SARIF format for security findings

### Monitoring & Alerts

- Slack notifications for test failures
- GitHub PR comments with test results
- Daily coverage reports
- Performance regression alerts

### Metrics Tracking

- Test execution time trends
- Coverage percentage over time
- Flaky test identification
- Performance benchmark comparisons

---

## Quick Reference

### Running Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# With coverage
npm run test:cov

# Performance tests
npm run test:performance

# Watch mode
npm run test:watch
```

### Test File Locations

```
apps/
├── api/
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── database/
│   │   ├── performance/
│   │   └── utils/
├── web/
│   ├── __tests__/
│   ├── e2e/
│   └── test-utils/
```

### Coverage Commands

```bash
# Generate coverage report
npm run test:cov

# View coverage in browser
npx serve coverage/lcov-report

# Check coverage thresholds
npm run test -- --coverage --passWithNoTests
```

This comprehensive testing strategy ensures the RestoPapa platform maintains high quality, reliability, and security standards throughout the development lifecycle.