/**
 * Jest configuration for REZ Scheduler Service tests
 */

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        strict: false,
        esModuleInterop: true,
        skipLibCheck: true,
        moduleResolution: 'node',
        resolveJsonModule: true,
        types: ['jest', 'node'],
      },
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  watchPathIgnorePatterns: ['/node_modules/', '/rez-scheduler-service/'],
};
