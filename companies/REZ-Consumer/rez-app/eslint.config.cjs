// https://docs.expo.dev/guides/using-eslint/
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const jestGlobals = {
  jest: 'readonly',
  expect: 'readonly',
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  beforeEach: 'readonly',
  beforeAll: 'readonly',
  afterEach: 'readonly',
  afterAll: 'readonly',
};

const rnGlobals = {
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  fetch: 'readonly',
  FormData: 'readonly',
  XMLHttpRequest: 'readonly',
  __DEV__: 'readonly',
  ErrorUtils: 'readonly',
  alert: 'readonly',
  navigator: 'readonly',
  self: 'readonly',
  caches: 'readonly',
  URLSearchParams: 'readonly',
  crypto: 'readonly',
  cryptoRandomUUID: 'readonly',
  require: 'readonly',
  console: 'readonly',
  process: 'readonly',
  // Missing globals from codebase analysis
  document: 'readonly',
  React: 'readonly',
  AbortController: 'readonly',
  performance: 'readonly',
  URL: 'readonly',
  NodeJS: 'readonly',
  File: 'readonly',
  Blob: 'readonly',
  sessionStorage: 'readonly',
  localStorage: 'readonly',
  IntersectionObserver: 'readonly',
  KeyboardEvent: 'readonly',
  FileReader: 'readonly',
  Buffer: 'readonly',
  HTMLVideoElement: 'readonly',
  JSX: 'readonly',
  PermissionStatus: 'readonly',
};

const nodeGlobals = {
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
  exports: 'readonly',
  require: 'readonly',
};

module.exports = [
  ...compat.extends('eslint-config-expo'),

  // Jest globals for test files
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/__tests__/**', '**/e2e/**'],
    languageOptions: {
      globals: { ...jestGlobals, ...rnGlobals },
    },
  },

  // Service/helper files with __dirname
  {
    files: ['scripts/**', 'config/**'],
    languageOptions: {
      globals: { ...nodeGlobals },
    },
  },

  {
    ignores: ['dist/*', 'coverage/**'],
  },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'constants/theme.ts',
      'constants/DesignTokens.ts',
      'constants/DesignSystem.ts',
      '**/*.test.*',
      '**/__tests__/**',
      'coverage/**',
    ],
    languageOptions: {
      globals: { ...rnGlobals },
    },
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message: 'Use design tokens from constants/theme.ts instead of raw hex colors.',
        },
      ],
      'no-undef': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
