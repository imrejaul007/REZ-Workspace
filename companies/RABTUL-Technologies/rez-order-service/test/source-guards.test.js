const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('order service validates required env vars before startup', () => {
  const filePath = path.join(__dirname, '..', 'src', 'index.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /function validateEnv\(\): void/);
  assert.match(source, /const required = \['MONGODB_URI', 'REDIS_URL'\]/);
  assert.match(source, /INTERNAL_SERVICE_TOKENS_JSON.*INTERNAL_SERVICE_TOKEN/s);
  assert.match(source, /validateEnv\(\);\s+logger\.info\('\[rez-order-service\] Starting\.\.\.'\);/s);
});

test('order http server keeps /orders/stream ahead of /orders/:id', () => {
  const filePath = path.join(__dirname, '..', 'src', 'httpServer.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  const streamIndex = source.indexOf("app.get('/orders/stream'");
  const byIdIndex = source.indexOf("app.get('/orders/:id'");

  assert.notEqual(streamIndex, -1, 'expected /orders/stream route');
  assert.notEqual(byIdIndex, -1, 'expected /orders/:id route');
  assert.ok(streamIndex < byIdIndex, '/orders/stream must be registered before /orders/:id');
});
