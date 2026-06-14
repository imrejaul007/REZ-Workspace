const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('search service validates required env vars before startup', () => {
  const filePath = path.join(__dirname, '..', 'src', 'index.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /function validateEnv\(\): void/);
  assert.match(source, /const required = \['MONGODB_URI', 'REDIS_URL', 'JWT_SECRET'\]/);
  assert.match(source, /validateEnv\(\);\s+logger\.info\('Starting rez-search-service\.\.\.'\);/s);
});

test('homepage user context reads wallet values from the nested wallet schema', () => {
  const filePath = path.join(__dirname, '..', 'src', 'routes', 'homepageRoutes.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /projection: \{ 'balance\.available': 1, 'savingsInsights\.totalSaved': 1 \}/);
  assert.match(source, /walletBalance: walletDoc\?\.balance\?\.available \?\? 0/);
  assert.match(source, /totalSaved: walletDoc\?\.savingsInsights\?\.totalSaved \?\? 0/);
});
