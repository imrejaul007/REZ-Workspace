module.exports = {
  // Backend TypeScript files
  'apps/api/**/*.{ts,js}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],

  // Frontend TypeScript/React files
  'apps/web/**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],

  // JSON files
  '**/*.json': [
    'prettier --write',
    'git add'
  ],

  // Markdown files
  '**/*.md': [
    'prettier --write',
    'git add'
  ],

  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write',
    'git add'
  ],

  // Package.json files - run audit
  '**/package.json': [
    'npm audit --audit-level=moderate'
  ],

  // Test files - ensure they pass
  '**/*.{test,spec}.{ts,tsx,js,jsx}': [
    'jest --bail --findRelatedTests --passWithNoTests'
  ]
}