/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true, allowSyntheticDefaultImports: true, strict: true, skipLibCheck: true } }] },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/__tests__/**'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};
export default config;