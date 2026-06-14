module.exports = {
  testEnvironment: 'node',
  rootDir: '../../..',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/services/$1',
  },
  testMatch: ['**/__tests__/services/ecosystem/*.test.ts'],
};
