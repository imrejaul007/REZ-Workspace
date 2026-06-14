import logger from './utils/logger';

/**
 * Comprehensive Test Runner Configuration for RestoPapa
 *
 * This configuration orchestrates all testing types:
 * - Unit Tests (Jest)
 * - Integration Tests (Jest with Supertest)
 * - E2E Tests (Playwright)
 * - Security Tests (Custom security test suite)
 * - Accessibility Tests (jest-axe)
 * - Performance Tests (existing K6/Artillery)
 */

const { execSync } = require('child_process');
const path = require('path');

const CONFIG = {
  // Test environments
  environments: {
    development: {
      apiUrl: 'http://localhost:3000',
      webUrl: 'http://localhost:3001',
      database: 'postgresql://localhost:5432/restopapa_test',
    },
    ci: {
      apiUrl: process.env.CI_API_URL || 'http://localhost:3000',
      webUrl: process.env.CI_WEB_URL || 'http://localhost:3001',
      database: process.env.CI_DATABASE_URL,
    },
  },

  // Test categories and their configurations
  testSuites: {
    unit: {
      framework: 'jest',
      patterns: [
        'apps/web/__tests__/**/*.test.{js,jsx,ts,tsx}',
        'apps/api/test/unit/**/*.test.{js,ts}',
      ],
      coverage: {
        threshold: {
          global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
          },
        },
      },
    },

    integration: {
      framework: 'jest',
      patterns: [
        'apps/api/test/integration/**/*.spec.{js,ts}',
      ],
      timeout: 30000,
      setupFiles: ['apps/api/test/setup.ts'],
      teardownFiles: ['apps/api/test/global-teardown.ts'],
    },

    security: {
      framework: 'jest',
      patterns: [
        'apps/api/test/security/**/*.spec.{js,ts}',
      ],
      timeout: 60000,
      parallel: false, // Security tests should run sequentially
    },

    accessibility: {
      framework: 'jest',
      patterns: [
        'apps/web/__tests__/accessibility/**/*.test.{js,jsx,ts,tsx}',
      ],
      setupFiles: ['<rootDir>/apps/web/jest-axe.setup.js'],
    },

    e2e: {
      framework: 'playwright',
      patterns: ['tests/e2e/**/*.spec.ts'],
      browsers: ['chromium', 'firefox', 'webkit'],
      parallel: true,
      timeout: 60000,
    },

    errorHandling: {
      framework: 'jest',
      patterns: [
        'apps/web/__tests__/error-handling/**/*.test.{js,jsx,ts,tsx}',
      ],
      setupFiles: ['<rootDir>/apps/web/__tests__/error-handling/msw.setup.js'],
    },

    performance: {
      framework: 'external',
      tools: ['k6', 'artillery'],
      patterns: ['tests/performance/**/*'],
    },
  },

  // Test execution strategies
  strategies: {
    // Fast feedback loop for development
    smoke: [
      'unit.critical',
      'integration.auth',
      'security.cors',
      'accessibility.login',
    ],

    // Pre-commit validation
    commit: [
      'unit',
      'accessibility',
      'errorHandling',
    ],

    // Pre-deployment validation
    deploy: [
      'unit',
      'integration',
      'security',
      'accessibility',
      'e2e.critical',
      'errorHandling',
    ],

    // Full regression testing
    full: [
      'unit',
      'integration',
      'security',
      'accessibility',
      'e2e',
      'errorHandling',
      'performance',
    ],
  },
};

class TestRunner {
  constructor(environment = 'development') {
    this.env = environment;
    this.config = CONFIG;
    this.results = {};
  }

  async runTestSuite(suiteName, pattern = null) {
    const suite = this.config.testSuites[suiteName];
    if (!suite) {
      throw new Error(`Unknown test suite: ${suiteName}`);
    }

    logger.info(`\\n🧪 Running ${suiteName} tests...`);
    const startTime = Date.now();

    try {
      let result;

      switch (suite.framework) {
        case 'jest':
          result = await this.runJestTests(suite, pattern);
          break;
        case 'playwright':
          result = await this.runPlaywrightTests(suite, pattern);
          break;
        case 'external':
          result = await this.runExternalTests(suite, pattern);
          break;
        default:
          throw new Error(`Unknown framework: ${suite.framework}`);
      }

      const duration = Date.now() - startTime;
      this.results[suiteName] = { ...result, duration };

      logger.info(`✅ ${suiteName} tests completed in ${duration}ms`);
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.results[suiteName] = {
        success: false,
        error: error.message,
        duration
      };

      logger.error(`❌ ${suiteName} tests failed: ${error.message}`);
      throw error;
    }
  }

  async runJestTests(suite, pattern) {
    const patterns = pattern ? [pattern] : suite.patterns;
    const jestConfig = {
      testMatch: patterns,
      testTimeout: suite.timeout || 30000,
      setupFilesAfterEnv: suite.setupFiles || [],
      globalTeardown: suite.teardownFiles?.[0],
      runInBand: !suite.parallel,
      coverageThreshold: suite.coverage?.threshold,
    };

    // Create temporary Jest config
    const configPath = path.join(process.cwd(), 'jest.temp.config.js');
    require('fs').writeFileSync(
      configPath,
      `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
    );

    try {
      const command = `npx jest --config=${configPath} --passWithNoTests`;
      const output = execSync(command, {
        encoding: 'utf8',
        env: { ...process.env, ...this.config.environments[this.env] }
      });

      return { success: true, output };
    } finally {
      // Clean up temp config
      try {
        require('fs').unlinkSync(configPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  async runPlaywrightTests(suite, pattern) {
    const patterns = pattern ? [pattern] : suite.patterns;
    const browsers = suite.browsers || ['chromium'];

    for (const browser of browsers) {
      logger.info(`  Running E2E tests on ${browser}...`);

      const command = `npx playwright test ${patterns.join(' ')} --project=${browser}`;
      const output = execSync(command, {
        encoding: 'utf8',
        env: {
          ...process.env,
          ...this.config.environments[this.env],
          E2E_BASE_URL: this.config.environments[this.env].webUrl,
          E2E_API_URL: this.config.environments[this.env].apiUrl,
        }
      });
    }

    return { success: true };
  }

  async runExternalTests(suite, pattern) {
    if (suite.tools.includes('k6')) {
      logger.info('  Running K6 performance tests...');
      execSync('npm run perf:k6:load', { encoding: 'utf8' });
    }

    if (suite.tools.includes('artillery')) {
      logger.info('  Running Artillery performance tests...');
      execSync('npm run perf:artillery', { encoding: 'utf8' });
    }

    return { success: true };
  }

  async runStrategy(strategyName) {
    const strategy = this.config.strategies[strategyName];
    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    logger.info(`\\n🚀 Running ${strategyName} testing strategy...`);
    const startTime = Date.now();

    const results = [];
    let hasFailures = false;

    for (const testSpec of strategy) {
      try {
        const [suiteName, pattern] = testSpec.split('.');
        const result = await this.runTestSuite(suiteName, pattern);
        results.push({ test: testSpec, success: true, result });
      } catch (error) {
        results.push({ test: testSpec, success: false, error: error.message });
        hasFailures = true;

        // Continue with other tests unless it's a critical failure
        if (strategyName === 'smoke' && testSpec.includes('critical')) {
          break;
        }
      }
    }

    const duration = Date.now() - startTime;
    const summary = this.generateSummary(results, duration);

    console.log(summary);

    if (hasFailures) {
      throw new Error(`${strategyName} strategy failed with ${results.filter(r => !r.success).length} failures`);
    }

    return results;
  }

  generateSummary(results, duration) {
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const total = results.length;

    let summary = `\\n📊 Test Summary\\n`;
    summary += `================\\n`;
    summary += `Total: ${total}\\n`;
    summary += `Passed: ${passed} ✅\\n`;
    summary += `Failed: ${failed} ❌\\n`;
    summary += `Duration: ${Math.round(duration / 1000)}s\\n\\n`;

    if (failed > 0) {
      summary += `Failed Tests:\\n`;
      results.filter(r => !r.success).forEach(result => {
        summary += `  - ${result.test}: ${result.error}\\n`;
      });
    }

    // Coverage summary if available
    if (this.results.unit?.coverage) {
      summary += `\\nCoverage Summary:\\n`;
      const coverage = this.results.unit.coverage;
      summary += `  Lines: ${coverage.lines}%\\n`;
      summary += `  Functions: ${coverage.functions}%\\n`;
      summary += `  Branches: ${coverage.branches}%\\n`;
      summary += `  Statements: ${coverage.statements}%\\n`;
    }

    return summary;
  }

  // CLI interface
  static async run() {
    const [,, command, ...args] = process.argv;
    const runner = new TestRunner(process.env.NODE_ENV || 'development');

    try {
      switch (command) {
        case 'suite':
          await runner.runTestSuite(args[0], args[1]);
          break;
        case 'strategy':
          await runner.runStrategy(args[0] || 'commit');
          break;
        case 'smoke':
          await runner.runStrategy('smoke');
          break;
        case 'full':
          await runner.runStrategy('full');
          break;
        default:
          logger.info(`
Usage: node test-runner-config.js <command> [args]

Commands:
  suite <name> [pattern]  - Run specific test suite
  strategy <name>         - Run predefined test strategy
  smoke                   - Run smoke tests (fast feedback)
  full                    - Run full test suite

Available test suites:
  - unit: Unit tests with coverage
  - integration: API integration tests
  - security: Security and penetration tests
  - accessibility: WCAG compliance tests
  - e2e: End-to-end user journey tests
  - errorHandling: Network failure and edge case tests

Available strategies:
  - smoke: Critical tests for fast feedback
  - commit: Pre-commit validation
  - deploy: Pre-deployment validation
  - full: Complete regression testing

Examples:
  node test-runner-config.js smoke
  node test-runner-config.js suite security cors
  node test-runner-config.js strategy deploy
          `);
      }
    } catch (error) {
      logger.error(`\\n💥 Test execution failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Export for programmatic use
module.exports = { TestRunner, CONFIG };

// CLI execution
if (require.main === module) {
  TestRunner.run();
}