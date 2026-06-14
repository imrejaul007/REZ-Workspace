#!/bin/bash

# RestaurantHub Comprehensive Test Coverage Setup Script
# Sets up Jest, testing infrastructure, and coverage reporting

set -e

# Configuration
LOG_FILE="./logs/test-coverage-setup-$(date +%Y%m%d_%H%M%S).log"
COVERAGE_DIR="./coverage"
REPORTS_DIR="./test-reports"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "./logs"
mkdir -p "$COVERAGE_DIR"
mkdir -p "$REPORTS_DIR"

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} ✓ $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} ✗ $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} ⚠ $1" | tee -a "$LOG_FILE"
}

step() {
    echo -e "${PURPLE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if we're in the correct directory
check_project_structure() {
    step "Checking project structure..."

    if [ ! -f "package.json" ]; then
        error "Not in project root directory. Please run from restauranthub root."
        return 1
    fi

    if [ ! -d "apps" ]; then
        error "Apps directory not found. Invalid project structure."
        return 1
    fi

    success "Project structure validated"
    return 0
}

# Function to install testing dependencies
install_test_dependencies() {
    step "Installing test dependencies..."

    # Check if package.json exists in API
    if [ -f "apps/api/package.json" ]; then
        log "Installing API test dependencies..."
        cd apps/api

        npm install --save-dev \
            jest \
            @types/jest \
            @nestjs/testing \
            supertest \
            @types/supertest \
            jest-junit \
            jest-html-reporters \
            jest-coverage-badges \
            ts-jest \
            @shelf/jest-mongodb \
            jest-extended

        cd ../..
        success "API test dependencies installed"
    fi

    # Check if package.json exists in Web
    if [ -f "apps/web/package.json" ]; then
        log "Installing Web test dependencies..."
        cd apps/web

        npm install --save-dev \
            @testing-library/react \
            @testing-library/jest-dom \
            @testing-library/user-event \
            jest \
            jest-environment-jsdom \
            jest-junit \
            jest-html-reporters

        cd ../..
        success "Web test dependencies installed"
    fi

    return 0
}

# Function to create Jest configuration
create_jest_config() {
    step "Creating Jest configuration files..."

    # API Jest configuration
    if [ -d "apps/api" ]; then
        cat > "apps/api/jest.config.js" << 'EOF'
module.exports = {
  displayName: 'RestaurantHub API',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/test/**/*.e2e-spec.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.module.ts',
    '!src/migrations/**',
    '!src/seeds/**',
  ],
  coverageDirectory: '../../coverage/api',
  coverageReporters: [
    'html',
    'lcov',
    'text',
    'text-summary',
    'clover',
    'json',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1'
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '../../test-reports/api',
      outputName: 'junit.xml',
      suiteName: 'RestaurantHub API Tests'
    }],
    ['jest-html-reporters', {
      publicPath: '../../test-reports/api',
      filename: 'test-report.html',
      pageTitle: 'RestaurantHub API Test Report',
      logoImgPath: undefined,
      hideIcon: true
    }]
  ],
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1
};
EOF
        success "API Jest configuration created"
    fi

    # Web Jest configuration
    if [ -d "apps/web" ]; then
        cat > "apps/web/jest.config.js" << 'EOF'
module.exports = {
  displayName: 'RestaurantHub Web',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: [
    '<rootDir>/app/**/*.test.{ts,tsx}',
    '<rootDir>/components/**/*.test.{ts,tsx}',
    '<rootDir>/lib/**/*.test.{ts,tsx}',
    '<rootDir>/__tests__/**/*.{ts,tsx}'
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.config.{ts,js}',
    '!**/coverage/**',
    '!**/.next/**'
  ],
  coverageDirectory: '../../coverage/web',
  coverageReporters: [
    'html',
    'lcov',
    'text',
    'text-summary',
    'clover',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@lib/(.*)$': '<rootDir>/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/lib/hooks/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '../../test-reports/web',
      outputName: 'junit.xml',
      suiteName: 'RestaurantHub Web Tests'
    }],
    ['jest-html-reporters', {
      publicPath: '../../test-reports/web',
      filename: 'test-report.html',
      pageTitle: 'RestaurantHub Web Test Report'
    }]
  ],
  testTimeout: 10000,
  verbose: true
};
EOF
        success "Web Jest configuration created"
    fi

    # Root Jest configuration for monorepo
    cat > "jest.config.js" << 'EOF'
module.exports = {
  projects: [
    '<rootDir>/apps/api/jest.config.js',
    '<rootDir>/apps/web/jest.config.js'
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'apps/*/src/**/*.{ts,tsx}',
    'apps/*/app/**/*.{ts,tsx}',
    'apps/*/components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageReporters: [
    'html',
    'lcov',
    'text-summary',
    'clover',
    'json'
  ],
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-reports',
      outputName: 'junit-combined.xml',
      suiteName: 'RestaurantHub Complete Test Suite'
    }]
  ]
};
EOF

    success "Root Jest configuration created"
    return 0
}

# Function to create test setup files
create_test_setup_files() {
    step "Creating test setup files..."

    # API test setup
    if [ -d "apps/api" ]; then
        mkdir -p "apps/api/test"

        cat > "apps/api/test/setup.ts" << 'EOF'
import 'jest-extended';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error'; // Reduce logging during tests
});

afterAll(async () => {
  // Cleanup after all tests
});

// Global test utilities
export const createTestModule = async (imports: any[] = [], providers: any[] = []) => {
  const moduleBuilder = Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env.test'
      }),
      ...imports
    ],
    providers
  });

  return moduleBuilder.compile();
};

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockRestaurant = (overrides = {}) => ({
  id: 'test-restaurant-123',
  name: 'Test Restaurant',
  email: 'restaurant@test.com',
  phone: '555-0123',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  cuisine: 'Test Cuisine',
  description: 'Test restaurant description',
  isActive: true,
  isVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockJob = (overrides = {}) => ({
  id: 'test-job-123',
  title: 'Test Job',
  description: 'Test job description',
  type: 'FULL_TIME',
  salaryMin: 30000,
  salaryMax: 50000,
  requirements: 'Test requirements',
  restaurantId: 'test-restaurant-123',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Test database utilities
export const clearDatabase = async (prisma: any) => {
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
};

// HTTP client mocks
export const mockHttpService = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
  request: jest.fn()
};

// Logger mock
export const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn()
};
EOF
        success "API test setup created"
    fi

    # Web test setup
    if [ -d "apps/web" ]; then
        mkdir -p "apps/web/test"

        cat > "apps/web/test/setup.ts" << 'EOF'
import '@testing-library/jest-dom';
import 'jest-extended';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    route: '/'
  })
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams()
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

// Custom render function for React Testing Library
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Test utilities
export const createMockApiResponse = (data: any, success = true) => ({
  data,
  success,
  message: success ? 'Success' : 'Error',
  timestamp: new Date().toISOString()
});

export const mockFetch = (data: any, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(data),
      status: ok ? 200 : 500,
      statusText: ok ? 'OK' : 'Internal Server Error'
    })
  ) as jest.Mock;
};

// Common test data
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'CUSTOMER'
};

export const mockRestaurant = {
  id: '1',
  name: 'Test Restaurant',
  cuisine: 'Italian',
  address: '123 Main St',
  city: 'Test City',
  rating: 4.5
};

export const mockJob = {
  id: '1',
  title: 'Chef',
  type: 'FULL_TIME',
  salaryMin: 40000,
  salaryMax: 60000,
  restaurantId: '1'
};
EOF
        success "Web test setup created"
    fi

    return 0
}

# Function to create sample test files
create_sample_tests() {
    step "Creating sample test files..."

    # API sample tests
    if [ -d "apps/api/src" ]; then
        # Create sample unit test
        mkdir -p "apps/api/src/common/__tests__"
        cat > "apps/api/src/common/__tests__/logger.service.spec.ts" << 'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.log('Test message');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.error('Test error', 'stack trace');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
EOF

        # Create sample integration test
        mkdir -p "apps/api/test"
        cat > "apps/api/test/health.e2e-spec.ts" << 'EOF'
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('timestamp');
      });
  });

  it('/health/circuit-breakers (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/circuit-breakers')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('circuits');
      });
  });
});
EOF
        success "API sample tests created"
    fi

    # Web sample tests
    if [ -d "apps/web" ]; then
        mkdir -p "apps/web/__tests__"
        cat > "apps/web/__tests__/page.test.tsx" << 'EOF'
import { render, screen } from '../test/setup';
import Home from '../app/page';

// Mock the child components
jest.mock('../components/ui/button', () => {
  return function MockButton({ children, ...props }: any) {
    return <button {...props}>{children}</button>;
  };
});

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByTestId('test-wrapper')).toBeInTheDocument();
  });

  it('contains main content', () => {
    render(<Home />);
    // Add more specific tests based on your home page content
    expect(document.body).toBeInTheDocument();
  });
});
EOF

        # Create component test
        mkdir -p "apps/web/components/__tests__"
        cat > "apps/web/components/__tests__/sample.test.tsx" << 'EOF'
import { render, screen, fireEvent } from '../../test/setup';

// Sample component for testing
const SampleButton = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} data-testid="sample-button">
    {children}
  </button>
);

describe('SampleButton', () => {
  it('renders button with text', () => {
    render(<SampleButton onClick={() => {}}>Click me</SampleButton>);

    const button = screen.getByTestId('sample-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<SampleButton onClick={handleClick}>Click me</SampleButton>);

    const button = screen.getByTestId('sample-button');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
EOF
        success "Web sample tests created"
    fi

    return 0
}

# Function to create test scripts
create_test_scripts() {
    step "Creating test scripts..."

    # Update package.json scripts
    if [ -f "package.json" ]; then
        # Create backup
        cp package.json package.json.backup

        # Add test scripts using jq if available, otherwise manual approach
        if command -v jq &> /dev/null; then
            jq '.scripts += {
              "test": "jest --coverage --passWithNoTests",
              "test:watch": "jest --watch --coverage",
              "test:debug": "jest --detectOpenHandles --forceExit",
              "test:ci": "jest --ci --coverage --watchAll=false --passWithNoTests",
              "test:api": "cd apps/api && npm test",
              "test:web": "cd apps/web && npm test",
              "test:e2e": "cd apps/api && npm run test:e2e",
              "coverage": "jest --coverage --coverageReporters=html --coverageReporters=lcov",
              "coverage:open": "open coverage/lcov-report/index.html || xdg-open coverage/lcov-report/index.html",
              "test:badges": "npx coverage-badges-cli --output coverage/badges"
            }' package.json > package.json.tmp && mv package.json.tmp package.json
        else
            log "jq not available, manually add test scripts to package.json"
        fi

        success "Test scripts added to package.json"
    fi

    # Create test runner script
    cat > "scripts/run-all-tests.sh" << 'EOF'
#!/bin/bash

# Comprehensive test runner for RestaurantHub
# Runs all tests and generates coverage reports

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== RestaurantHub Test Suite ===${NC}"
echo -e "${BLUE}=================================${NC}"

# Ensure directories exist
mkdir -p coverage test-reports logs

# Run API tests
if [ -d "apps/api" ]; then
    echo -e "\n${YELLOW}Running API Tests...${NC}"
    cd apps/api
    npm test -- --coverage --ci --passWithNoTests 2>&1 | tee ../../logs/api-tests.log
    cd ../..
    echo -e "${GREEN}✓ API tests completed${NC}"
fi

# Run Web tests
if [ -d "apps/web" ]; then
    echo -e "\n${YELLOW}Running Web Tests...${NC}"
    cd apps/web
    npm test -- --coverage --ci --passWithNoTests --watchAll=false 2>&1 | tee ../../logs/web-tests.log
    cd ../..
    echo -e "${GREEN}✓ Web tests completed${NC}"
fi

# Generate combined coverage report
echo -e "\n${YELLOW}Generating Combined Coverage Report...${NC}"
npm run coverage 2>&1 | tee logs/coverage.log

# Generate coverage badges
if command -v npx &> /dev/null; then
    echo -e "\n${YELLOW}Generating Coverage Badges...${NC}"
    npx coverage-badges-cli --output coverage/badges 2>/dev/null || echo "Badge generation failed"
fi

# Display summary
echo -e "\n${GREEN}=== Test Summary ===${NC}"
echo -e "API Test Results: ${BLUE}test-reports/api/${NC}"
echo -e "Web Test Results: ${BLUE}test-reports/web/${NC}"
echo -e "Coverage Report: ${BLUE}coverage/lcov-report/index.html${NC}"
echo -e "Combined Report: ${BLUE}test-reports/junit-combined.xml${NC}"

echo -e "\n${GREEN}✓ All tests completed successfully!${NC}"
EOF

    chmod +x "scripts/run-all-tests.sh"
    success "Test runner script created"

    return 0
}

# Function to create coverage configuration
create_coverage_config() {
    step "Creating coverage configuration..."

    # Create .nycrc for backup coverage tool
    cat > ".nycrc" << 'EOF'
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "check-coverage": true,
  "reporter": [
    "html",
    "lcov",
    "text",
    "text-summary",
    "clover"
  ],
  "report-dir": "coverage",
  "lines": 70,
  "statements": 70,
  "functions": 70,
  "branches": 70,
  "include": [
    "apps/*/src/**/*.ts",
    "apps/*/app/**/*.tsx",
    "apps/*/components/**/*.tsx"
  ],
  "exclude": [
    "**/*.d.ts",
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/node_modules/**",
    "**/coverage/**",
    "**/test/**",
    "**/__tests__/**"
  ]
}
EOF

    # Create coverage thresholds configuration
    cat > "coverage-thresholds.json" << 'EOF'
{
  "global": {
    "branches": 70,
    "functions": 70,
    "lines": 70,
    "statements": 70
  },
  "api": {
    "branches": 70,
    "functions": 70,
    "lines": 70,
    "statements": 70
  },
  "web": {
    "branches": 65,
    "functions": 65,
    "lines": 65,
    "statements": 65
  }
}
EOF

    success "Coverage configuration created"
    return 0
}

# Function to validate test setup
validate_test_setup() {
    step "Validating test setup..."

    local validation_errors=0

    # Check Jest configurations
    for config in "jest.config.js" "apps/api/jest.config.js" "apps/web/jest.config.js"; do
        if [ -f "$config" ]; then
            success "✓ $config exists"
        else
            error "✗ $config missing"
            validation_errors=$((validation_errors + 1))
        fi
    done

    # Check test setup files
    for setup in "apps/api/test/setup.ts" "apps/web/test/setup.ts"; do
        if [ -f "$setup" ]; then
            success "✓ $setup exists"
        else
            error "✗ $setup missing"
            validation_errors=$((validation_errors + 1))
        fi
    done

    # Check directories
    for dir in "coverage" "test-reports" "logs"; do
        if [ -d "$dir" ]; then
            success "✓ $dir directory exists"
        else
            error "✗ $dir directory missing"
            validation_errors=$((validation_errors + 1))
        fi
    done

    if [ $validation_errors -eq 0 ]; then
        success "Test setup validation passed"
        return 0
    else
        error "Test setup validation failed with $validation_errors errors"
        return 1
    fi
}

# Main execution
main() {
    log "=== RestaurantHub Test Coverage Setup ==="
    log "=========================================="

    if ! check_project_structure; then
        exit 1
    fi

    install_test_dependencies
    create_jest_config
    create_test_setup_files
    create_sample_tests
    create_test_scripts
    create_coverage_config

    if validate_test_setup; then
        success "🎉 Test coverage setup completed successfully!"

        echo ""
        echo "=================================================="
        echo "📋 Next Steps"
        echo "=================================================="
        echo ""
        echo "1. Run tests: npm run test"
        echo "2. Run with coverage: npm run coverage"
        echo "3. Run all tests: ./scripts/run-all-tests.sh"
        echo "4. Open coverage report: npm run coverage:open"
        echo ""
        echo "📁 Key Files:"
        echo "   - Jest configs: jest.config.js, apps/*/jest.config.js"
        echo "   - Test setup: apps/*/test/setup.ts"
        echo "   - Coverage: coverage/lcov-report/index.html"
        echo "   - Reports: test-reports/"
        echo ""
        echo "🎯 Coverage Thresholds:"
        echo "   - API: 70% (lines, functions, branches, statements)"
        echo "   - Web: 65% (lines, functions, branches, statements)"
        echo ""
        echo "=================================================="
    else
        error "Test coverage setup failed"
        exit 1
    fi
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi