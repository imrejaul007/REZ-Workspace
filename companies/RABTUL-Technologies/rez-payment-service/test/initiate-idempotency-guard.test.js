const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('payment initiate route accepts and forwards idempotency keys', () => {
  const filePath = path.join(__dirname, '..', 'src', 'routes', 'paymentRoutes.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /orchestratorIdempotencyKey: z\.string\(\)\.min\(1\)\.max\(200\)\.optional\(\)/);
  assert.match(source, /idempotencyKey: z\.string\(\)\.min\(1\)\.max\(200\)\.optional\(\)/);
  assert.match(source, /orchestratorIdempotencyKey: orchestratorIdempotencyKey \|\| idempotencyKey/);
});
