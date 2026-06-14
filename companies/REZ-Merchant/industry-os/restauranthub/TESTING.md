# RestoPapa Testing Guide

This document provides comprehensive guidelines for testing in the RestoPapa application, covering both backend (NestJS) and frontend (Next.js/React) testing strategies.

## Table of Contents

- [Overview](#overview)
- [Testing Philosophy](#testing-philosophy)
- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Test Utilities](#test-utilities)
- [Coverage Requirements](#coverage-requirements)
- [Running Tests](#running-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Our testing strategy follows the testing pyramid:

```
    /\
   /  \     E2E Tests (Few)
  /    \
 /      \   Integration Tests (Some)
/        \
----------  Unit Tests (Many)
```

- **Unit Tests**: Test individual functions, methods, and components in isolation
- **Integration Tests**: Test API endpoints and component interactions
- **E2E Tests**: Test complete user journeys across the application

## Testing Philosophy

### Core Principles

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Fail Fast**: Tests should fail quickly when code breaks
3. **Readable Tests**: Tests should serve as documentation
4. **Deterministic**: Tests should produce consistent results
5. **Independent**: Tests should not depend on each other

### Coverage Goals

- **Critical Path**: 90%+ coverage for authentication, payments, orders
- **Business Logic**: 85%+ coverage for core business rules
- **UI Components**: 70%+ coverage for user-facing components
- **Utilities**: 80%+ coverage for helper functions

## Backend Testing

### Structure

```
apps/api/test/
├── unit/                 # Unit tests
│   ├── auth/
│   ├── users/
│   └── ...
├── integration/          # Integration tests
│   ├── auth/
│   └── ...
├── e2e/                  # End-to-end tests
├── utils/                # Test utilities
│   ├── test-fixtures.ts
│   └── mock-services.ts
└── setup.ts              # Global test setup
```

### Unit Testing

#### Service Testing Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { createMockPrismaService } from '../../utils/mock-services';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
  });

  it('should create user successfully', async () => {
    // Arrange
    const signUpDto = { email: 'test@example.com', password: 'password' };
    const expectedUser = { id: 'user-id', email: signUpDto.email };

    prismaService.user.create.mockResolvedValue(expectedUser);

    // Act
    const result = await service.signUp(signUpDto);

    // Assert
    expect(result.user).toEqual(expectedUser);
    expect(prismaService.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: signUpDto.email,
        }),
      })
    );
  });
});
```

#### Controller Testing Example

```typescript
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { createMockRequest } from '../../utils/mock-services';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  it('should handle sign up request', async () => {
    const signUpDto = { email: 'test@example.com', password: 'password' };
    const expectedResult = { user: { id: 'user-id' }, accessToken: 'token' };

    authService.signUp.mockResolvedValue(expectedResult);

    const result = await controller.signUp(signUpDto);

    expect(result).toEqual(expectedResult);
  });
});
```

### Integration Testing

Integration tests test complete API endpoints with real database interactions (using test database).

```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('Auth Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it('should create user via API', async () => {
    const signUpData = {
      email: 'test@example.com',
      password: 'StrongPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signUpData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('accessToken');
  });
});
```

### Test Commands

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

## Frontend Testing

### Structure

```
apps/web/__tests__/
├── components/           # Component tests
│   ├── auth/
│   ├── ui/
│   └── ...
├── pages/               # Page tests
├── utils/               # Test utilities
│   └── test-utils.tsx
└── setup.ts             # Global setup
```

### Component Testing

#### Basic Component Test

```typescript
import { render, screen } from '../../../__tests__/utils/test-utils';
import { LoginForm } from '../../../components/auth/LoginForm';

describe('LoginForm', () => {
  it('renders login form correctly', () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const mockSubmit = jest.fn();
    const user = userEvent.setup();

    render(<LoginForm onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

#### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../../../hooks/useAuth';

describe('useAuth', () => {
  it('should handle login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Page Testing

```typescript
import { render, screen } from '../../../__tests__/utils/test-utils';
import LoginPage from '../../../app/auth/login/page';

describe('Login Page', () => {
  it('renders login page', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });
});
```

### Test Commands

```bash
# Run all frontend tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Test Utilities

### Backend Utilities

Located in `apps/api/test/utils/`:

- **test-fixtures.ts**: Generate realistic test data
- **mock-services.ts**: Mock external services and dependencies
- **setup.ts**: Global test configuration

### Frontend Utilities

Located in `apps/web/__tests__/utils/`:

- **test-utils.tsx**: Custom render function with providers
- **mock-data.ts**: Mock data for components

### Using Test Fixtures

```typescript
import { TestFixtures } from '../../utils/test-fixtures';

const mockUser = TestFixtures.createUser({
  email: 'custom@example.com',
  role: 'RESTAURANT',
});

const mockRestaurant = TestFixtures.createRestaurant({
  name: 'Custom Restaurant',
});
```

## Coverage Requirements

### Backend Coverage Targets

- **Authentication Module**: 90%+
- **Payment Processing**: 95%+
- **Order Management**: 85%+
- **User Management**: 85%+
- **General Services**: 80%+

### Frontend Coverage Targets

- **Auth Components**: 85%+
- **Form Components**: 80%+
- **Critical User Flows**: 85%+
- **Utility Functions**: 90%+

### Checking Coverage

```bash
# Backend coverage
cd apps/api && npm run test:cov

# Frontend coverage
cd apps/web && npm run test -- --coverage
```

## Running Tests

### Local Development

```bash
# Install dependencies
npm install

# Run all tests
npm run test:all

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:ci
```

### CI/CD Pipeline

Tests run automatically on:

- Pull request creation/updates
- Pushes to main branch
- Pre-deployment validation

### Environment Setup

1. **Test Database**: Separate database for integration tests
2. **Mock Services**: External services are mocked in tests
3. **Test Data**: Fixtures provide consistent test data

## Best Practices

### Writing Good Tests

1. **Arrange, Act, Assert (AAA) Pattern**

```typescript
it('should create order successfully', async () => {
  // Arrange
  const orderData = { customerId: 'user-1', items: [...] };
  const expectedOrder = { id: 'order-1', status: 'PENDING' };
  mockOrderService.create.mockResolvedValue(expectedOrder);

  // Act
  const result = await orderController.create(orderData);

  // Assert
  expect(result).toEqual(expectedOrder);
  expect(mockOrderService.create).toHaveBeenCalledWith(orderData);
});
```

2. **Descriptive Test Names**

```typescript
// ✅ Good
it('should return 401 when user provides invalid credentials')

// ❌ Bad
it('should handle login')
```

3. **Test Edge Cases**

```typescript
describe('Order validation', () => {
  it('should reject orders with negative quantities');
  it('should reject orders without items');
  it('should handle orders with unavailable items');
  it('should validate maximum order value limits');
});
```

4. **Use Data Builders for Complex Objects**

```typescript
const orderBuilder = new OrderBuilder()
  .withCustomer('customer-1')
  .withItems([item1, item2])
  .withDeliveryAddress(address)
  .build();
```

### Testing Async Code

```typescript
// ✅ Async/await
it('should create user', async () => {
  const result = await userService.create(userData);
  expect(result).toBeTruthy();
});

// ✅ Promise resolution
it('should handle API call', () => {
  return expect(apiCall()).resolves.toMatchObject({ success: true });
});

// ✅ Testing rejections
it('should handle API errors', () => {
  return expect(failingApiCall()).rejects.toThrow('Network error');
});
```

### Testing React Components

```typescript
// ✅ Test user interactions
it('should show success message after form submission', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/success/i)).toBeInTheDocument();
});

// ✅ Test error states
it('should display error for invalid email', async () => {
  const user = userEvent.setup();
  render(<ContactForm />);

  await user.type(screen.getByLabelText(/email/i), 'invalid-email');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

### Mocking Guidelines

1. **Mock External Dependencies**

```typescript
// ✅ Mock external APIs
jest.mock('../services/paymentService', () => ({
  processPayment: jest.fn().mockResolvedValue({ success: true }),
}));

// ✅ Mock third-party libraries
jest.mock('stripe', () => ({
  charges: {
    create: jest.fn(),
  },
}));
```

2. **Don't Mock What You're Testing**

```typescript
// ❌ Don't mock the service you're testing
jest.mock('../userService');

// ✅ Mock its dependencies instead
jest.mock('../database/userRepository');
```

## Troubleshooting

### Common Issues

1. **Tests Timeout**
   - Increase timeout in Jest config
   - Check for unresolved promises
   - Ensure proper cleanup in afterEach/afterAll

2. **Database Connection Issues**
   - Verify test database configuration
   - Check database cleanup between tests
   - Ensure proper connection closing

3. **Mock Issues**
   - Clear mocks between tests
   - Verify mock setup timing
   - Check mock return values

4. **Component Testing Issues**
   - Wrap components with necessary providers
   - Mock external hooks and services
   - Use proper queries and assertions

### Debug Tips

```typescript
// Add debugging to tests
it('should process order', async () => {
  console.log('Test data:', testData);
  const result = await orderService.process(testData);
  console.log('Result:', result);
  expect(result).toBeTruthy();
});

// Use Jest debugging
it('should work', async () => {
  jest.setTimeout(30000); // Increase timeout for debugging
  // ... test code
});
```

### Performance Optimization

1. **Parallel Test Execution**
   - Use Jest workers effectively
   - Avoid shared state between tests

2. **Test Setup Optimization**
   - Reuse expensive setup when possible
   - Use beforeAll for one-time setup

3. **Mock Optimization**
   - Use jest.createMockFromModule for complex mocks
   - Reset only necessary mocks

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Quality Gates

Tests must pass for:
- Pull request merges
- Production deployments
- Coverage thresholds met

---

For questions or issues with testing, please refer to the team documentation or reach out to the development team.