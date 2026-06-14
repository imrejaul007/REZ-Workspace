const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('order service exposes internal summary routes for finance consumers', () => {
  const filePath = path.join(__dirname, '..', 'src', 'httpServer.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  assert.match(source, /app\.get\('\/orders\/summary\/:userId', orderSummaryHandler\)/);
  assert.match(source, /app\.get\('\/internal\/orders\/summary\/:userId', orderSummaryHandler\)/);
  assert.match(source, /totalSpend30d/);
  assert.match(source, /orderCount30d/);
  assert.match(source, /avgOrderValue/);
});
