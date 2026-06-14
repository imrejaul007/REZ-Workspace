module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@react-native-async-storage/async-storage$': '<rootDir>/__mocks__/@react-native-async-storage/async-storage.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(expo|@expo|expo-.*|@unimodules|unimodules|@react-native|react-native|@react-navigation|react-native-reanimated)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/globals.ts'],
  testTimeout: 15000,
  verbose: true,
  clearMocks: true,
};
