# RestoPapa API Testing Suite

This comprehensive testing suite provides thorough coverage of the RestoPapa API with a focus on security, performance, and reliability.

## Overview

The testing infrastructure includes:
- **Unit Tests**: Isolated testing of individual services and components
- **Integration Tests**: End-to-end API testing with mock database
- **Security Tests**: Comprehensive security vulnerability testing
- **Performance Tests**: Load testing and response time validation
- **Mock Database**: Complete database simulation for testing without external dependencies

## Test Structure

```
test/
├── utils/                    # Test utilities and helpers
│   ├── mock-database.service.ts     # Mock database implementation
│   ├── mock-prisma.service.ts       # Prisma service mock
│   ├── test-factories.ts            # Data factory for creating test objects
│   ├── auth-test-helpers.ts         # Authentication testing utilities
│   └── api-test-helpers.ts          # HTTP request testing utilities
├── unit/                     # Unit tests
│   └── auth/                 # Authentication module tests
│       ├── auth-basic.test.js        # Basic functionality tests
│       └── auth-service.test.js      # Comprehensive auth service tests
├── integration/              # Integration tests
│   └── auth/                 # Authentication integration tests
│       └── auth-integration.test.js  # Full API endpoint testing
├── security/                 # Security tests
│   └── auth-security.test.js         # Security vulnerability tests
├── performance/              # Performance tests
│   └── auth-performance.test.js     # Load and response time tests
├── setup.ts                  # Global test setup and utilities
├── global-setup.ts           # Jest global setup (mock database initialization)
└── global-teardown.ts        # Jest global teardown (cleanup)
```

## Configuration

### Jest Configuration
- **Environment**: Node.js with mock database support
- **Coverage Threshold**: 80% global, 90% for auth module
- **Test Environment**: Isolated with MOCK_DATABASE=true
- **Timeout**: 30 seconds for integration tests

### Mock Database
The testing suite uses a complete mock database implementation that:
- Simulates all Prisma operations
- Maintains data consistency within test sessions
- Provides realistic data relationships
- Supports transaction simulation
- Automatically cleans up between tests

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- --testPathPattern="unit"
```

### Authentication Tests
```bash
npm test -- --testPathPattern="auth.*test.js"
```

### Coverage Report
```bash
npm test -- --coverage
```

### Specific Test Suites
```bash
# Unit tests
npm test -- --testPathPattern="auth-service.test.js"

# Integration tests
npm test -- --testPathPattern="auth-integration.test.js"

# Security tests
npm test -- --testPathPattern="auth-security.test.js"

# Performance tests
npm test -- --testPathPattern="auth-performance.test.js"
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual service methods in isolation

**Coverage**:
- AuthService functionality
- User registration and validation
- Login and authentication
- Token generation and refresh
- Password reset flows
- Input sanitization

**Features**:
- Complete service mocking
- Dependency injection testing
- Error handling validation
- Business logic verification

### 2. Integration Tests

**Purpose**: Test complete API endpoints with realistic data flow

**Coverage**:
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout
- POST /auth/forgot-password
- Authentication middleware
- Rate limiting behavior

**Features**:
- Full HTTP request/response testing
- Database integration with mock data
- Authentication header validation
- Error response verification
- Success scenario validation

### 3. Security Tests

**Purpose**: Validate security measures and prevent vulnerabilities

**Test Categories**:
- **SQL Injection Protection**: Tests against various SQL injection attacks
- **XSS Prevention**: Cross-site scripting attack prevention
- **Brute Force Protection**: Rate limiting and account lockout
- **JWT Security**: Token tampering and expiration validation
- **Input Validation**: Malformed and oversized input handling
- **Password Security**: Complexity requirements and secure hashing
- **Session Security**: Token invalidation and refresh token reuse
- **CORS Security**: Cross-origin request handling

**Security Measures Tested**:
- Input sanitization
- SQL injection prevention
- XSS attack mitigation
- Rate limiting implementation
- JWT token security
- Password complexity enforcement
- Session management security

### 4. Performance Tests

**Purpose**: Ensure API performance meets requirements

**Test Categories**:
- **Response Time**: Individual endpoint response times
- **Concurrent Load**: Multiple simultaneous requests
- **Memory Usage**: Memory leak detection
- **Database Performance**: Query optimization validation
- **Token Operations**: JWT generation and verification speed

**Performance Benchmarks**:
- Login: < 2 seconds
- Registration: < 3 seconds
- Token Refresh: < 1 second
- Concurrent Requests: Handle 10+ simultaneous requests
- Memory Usage: < 50MB increase for 100 requests

## Test Utilities

### TestFactories
Provides factory methods for creating test data:
- `createUser()`: Mock user objects
- `createProfile()`: User profile data
- `createRestaurant()`: Restaurant data
- `createJob()`: Job posting data
- `createLoginCredentials()`: Authentication data

### AuthTestHelpers
Authentication-specific testing utilities:
- JWT token generation and validation
- Password hashing and verification
- Authentication header creation
- 2FA testing support
- Mock authentication responses

### ApiTestHelpers
HTTP request testing utilities:
- Authenticated request methods
- Input validation testing
- Pagination testing
- Search functionality testing
- File upload testing

### MockDatabaseService
Complete database simulation:
- In-memory data storage
- Relationship management
- Transaction simulation
- Query result simulation
- Automatic cleanup

## Coverage Goals

### Current Coverage (Unit Tests)
- **Auth Module**: 27.93% statements, 0% branches, 4.16% functions
- **Target**: 80% global, 90% auth module

### Coverage Improvements Needed
1. **Service Implementation Testing**: Direct testing of AuthService methods
2. **Guard Testing**: JWT and brute force guard validation
3. **Strategy Testing**: Passport strategy implementations
4. **Controller Testing**: HTTP endpoint method testing

## Environment Variables

### Test Environment
```bash
NODE_ENV=test
MOCK_DATABASE=true
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_REFRESH_SECRET=test-refresh-secret-key-for-testing-only
```

### Security Testing
- Uses secure test secrets
- Isolated test environment
- No production data exposure
- Comprehensive security validation

## Continuous Integration

### Test Pipeline
1. **Environment Setup**: Mock database initialization
2. **Unit Tests**: Service-level testing
3. **Integration Tests**: API endpoint testing
4. **Security Tests**: Vulnerability assessment
5. **Performance Tests**: Load and response time validation
6. **Coverage Report**: Code coverage analysis
7. **Cleanup**: Environment teardown

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- Security tests must pass
- Performance benchmarks must be met

## Best Practices

### Test Writing
1. **Isolation**: Each test should be independent
2. **Descriptive Names**: Clear test descriptions
3. **Arrange-Act-Assert**: Structured test organization
4. **Mock External Dependencies**: Use mocks for external services
5. **Test Edge Cases**: Include error scenarios

### Data Management
1. **Factory Pattern**: Use TestFactories for data creation
2. **Cleanup**: Always clean up test data
3. **Isolation**: No test data sharing between tests
4. **Realistic Data**: Use representative test data

### Security Testing
1. **Comprehensive Coverage**: Test all attack vectors
2. **Real-world Scenarios**: Use actual attack payloads
3. **Validation**: Verify security measures work correctly
4. **Documentation**: Document security test results

## Troubleshooting

### Common Issues

**Jest Configuration Errors**:
- Ensure TypeScript compilation is correct
- Check module resolution paths
- Verify Jest preset configuration

**Database Connection Issues**:
- Confirm MOCK_DATABASE=true is set
- Check MockPrismaService is properly configured
- Verify test environment setup

**Authentication Failures**:
- Check JWT secret configuration
- Verify AuthTestHelpers setup
- Confirm token generation methods

**Performance Test Failures**:
- Adjust timeout values for slower systems
- Consider system load during testing
- Review performance benchmarks

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testPathPattern="auth-service.test.js" --verbose

# Check Jest configuration
npx jest --showConfig

# Run tests with coverage details
npm test -- --coverage --verbose
```

## Future Enhancements

### Planned Improvements
1. **Real Integration Tests**: Tests with actual database
2. **End-to-End Tests**: Full user journey testing
3. **API Documentation Tests**: Schema validation
4. **Load Testing**: Stress testing with Artillery/K6
5. **Visual Testing**: UI component testing

### Additional Test Suites
1. **Users Service**: User management functionality
2. **Restaurant Service**: Restaurant operations
3. **Job Service**: Job posting and management
4. **Email Service**: Email notification testing
5. **File Upload**: File handling and validation

### Enhanced Security Testing
1. **OWASP Top 10**: Complete vulnerability assessment
2. **Penetration Testing**: Automated security scanning
3. **Compliance Testing**: GDPR, PCI DSS validation
4. **Audit Logging**: Security event testing

## Contributing

### Adding New Tests
1. Follow existing test structure
2. Use appropriate test utilities
3. Include security considerations
4. Add performance benchmarks
5. Update documentation

### Test Standards
- 100% success rate required
- Comprehensive error testing
- Security validation included
- Performance benchmarks met
- Code coverage maintained

This testing suite provides a robust foundation for ensuring the RestoPapa API is secure, performant, and reliable in production environments.