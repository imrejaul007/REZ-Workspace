// https://docs.expo.dev/guides/using-eslint/
// SECURITY FIX: Added rules to prevent console.log and Math.random() in production code
module.exports = {
  extends: 'expo',
  rules: {
    // SECURITY FIX: Prevent console.log statements outside __DEV__ guards
    // Use the centralized logger from @/utils/logger instead
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // SECURITY FIX: Prevent Math.random() for ID/token generation (use crypto.getRandomValues instead)
    'no-restricted-globals': [
      'error',
      {
        name: 'Math',
        message: 'Math.random() is not cryptographically secure. Use crypto.getRandomValues() or uuid instead.',
      },
    ],
    // Warn on hardcoded hex color literals — use design tokens from @/constants/theme instead
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'Literal[value=/^#[0-9A-Fa-f]{3,8}$/]',
        message: 'Avoid hardcoded hex colors. Use design tokens from @/constants/theme instead.',
      },
    ],
  },
  overrides: [
    {
      // Allow hex literals in token definition files (where they belong)
      files: [
        'constants/theme.ts',
        'constants/Colors.ts',
        'constants/OffersTheme.ts',
        'constants/categoryThemes.ts',
        'constants/experienceThemes.ts',
        'constants/brand.ts',
      ],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
