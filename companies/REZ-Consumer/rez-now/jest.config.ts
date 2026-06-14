import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          // Override bundler resolution to work with Jest (CommonJS)
          moduleResolution: 'node',
          module: 'commonjs',
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/patchLocation.js'],
  clearMocks: true,
  resetMocks: true,
};

export default config;
