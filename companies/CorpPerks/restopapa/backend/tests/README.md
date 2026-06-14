# ReZ Backend Test Suite

Comprehensive test coverage for the resturistan/backend API.

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run specific test suite
npm run test:auth
npm run test:orders
npm run test:credit
npm run test:products
npm run test:search

# Run cross-service tests
npm run test:cross
```

## Test Structure

```
tests/
├── setup.ts              # Jest configuration & global mocks
├── factories/            # Test data factories
│   └── index.ts         # User, Order, Product, etc. factories
├── unit/                 # Unit tests
│   ├── auth.service.spec.ts
│   ├── orders.service.spec.ts
│   ├── credit.service.spec.ts
│   ├── products.service.spec.ts
│   └── search.service.spec.ts
├── integration/          # Integration tests
└── cross-service/        # Cross-service tests
    └── order-credit.spec.ts
```

## Test Categories

### Unit Tests
- **auth.service.spec.ts** - Authentication, JWT, password hashing
- **orders.service.spec.ts** - Order creation, status FSM, cancellation
- **credit.service.spec.ts** - Coin earning, redemption, balance
- **products.service.spec.ts** - Product CRUD, search, filters
- **search.service.spec.ts** - Job, employee, product, restaurant search

### Cross-Service Tests
- **order-credit.spec.ts** - Orders + Credit integration

## Test Coverage Targets

| Service | Statements | Branches | Functions | Lines |
|---------|-----------|----------|-----------|-------|
| Auth | 90% | 85% | 95% | 90% |
| Orders | 90% | 85% | 95% | 90% |
| Credit | 95% | 90% | 100% | 95% |
| Products | 85% | 80% | 90% | 85% |
| Search | 85% | 75% | 90% | 85% |

## Test Data Factories

Use factories for consistent test data:

```typescript
import {
  createUser,
  createOrder,
  createProduct,
  createCreditTransaction,
} from './factories';

// Create test user
const user = createUser({ role: 'admin' });

// Create test order
const order = createOrder({
  status: 'pending',
  items: [createOrderItem()],
});
```

## Writing Tests

### Test Template

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    prisma = module.get(PrismaService);
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = createTestData();
      mockPrisma.method.mockResolvedValue(input);

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toHaveProperty('expected');
    });

    it('should throw error for invalid input', async () => {
      await expect(service.method(invalidInput)).rejects.toThrow(ErrorType);
    });
  });
});
```

## Business Logic Tests

### Order State Machine
```typescript
const validTransitions = [
  ['pending', 'confirmed'],
  ['confirmed', 'preparing'],
  ['preparing', 'ready'],
  ['ready', 'delivered'],
];

it.each(validTransitions)(
  'should allow: %s → %s',
  async (from, to) => {
    // Test transition
  },
);
```

### Coin Economy
```typescript
describe('Coin Economy', () => {
  it('should earn 1 coin per ₹1 spent', () => { /* ... */ });
  it('should redeem at 1:1 rate', () => { /* ... */ });
  it('should take 1% platform margin', () => { /* ... */ });
});
```

## Mock Patterns

### Prisma Service
```typescript
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  marketplaceOrder: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(async (cb) => cb(mockPrisma)),
};
```

### Transaction Mocking
```typescript
mockPrisma.$transaction.mockImplementation(async (callback) => {
  const tx = {
    marketplaceOrder: { create: jest.fn().mockResolvedValue(order) },
    creditTransaction: { create: jest.fn().mockResolvedValue(tx) },
  };
  return callback(tx);
});
```

## CI/CD Integration

Tests run automatically on:
- Every PR
- Merge to main
- Daily at midnight

Quality gates:
- All tests must pass
- Coverage must meet thresholds
- No flaky tests allowed

## Debugging Tests

```bash
# Watch mode
npm run test:watch

# Debug mode
npm run test:debug

# Run specific test file
npx jest tests/unit/auth.service.spec.ts

# Run with verbose output
npx jest tests/unit/auth.service.spec.ts --verbose
```

## Adding New Tests

1. Create factory in `tests/factories/index.ts` if needed
2. Create test file in `tests/unit/`
3. Add npm script for running specific tests
4. Update coverage targets if needed

## Test Data Cleanup

Each test should be independent. Use `beforeEach` to reset mocks:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Performance

- Unit tests: < 100ms
- Integration tests: < 500ms
- Cross-service tests: < 1000ms

Run performance benchmarks:
```bash
npx jest --testNamePattern="performance" --verbose
```
