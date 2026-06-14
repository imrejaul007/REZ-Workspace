const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource(...segments) {
  return fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8');
}

test('order http server applies requireInternalToken before internal order routes', () => {
  const source = readSource('src', 'httpServer.ts');

  const guardPos = source.indexOf('app.use(requireInternalToken)');
  const summaryPos = source.indexOf("app.get('/internal/orders/summary/:userId'");
  const listPos = source.indexOf("app.get('/orders'");
  const streamPos = source.indexOf("app.get('/orders/stream'");
  const byIdPos = source.indexOf("app.get('/orders/:id'");

  assert.notEqual(guardPos, -1, 'expected requireInternalToken guard');
  assert.ok(guardPos < summaryPos, 'internal summary route must remain behind internal auth');
  assert.ok(guardPos < listPos, 'orders list route must remain behind internal auth');
  assert.ok(guardPos < streamPos, 'orders stream route must remain behind internal auth');
  assert.ok(guardPos < byIdPos, 'single-order route must remain behind internal auth');
});

test('order service keeps its internal summary route alongside the finance compatibility path', () => {
  const source = readSource('src', 'httpServer.ts');

  assert.match(source, /app\.get\('\/orders\/summary\/:userId', orderSummaryHandler\)/);
  assert.match(source, /app\.get\('\/internal\/orders\/summary\/:userId', orderSummaryHandler\)/);
});

test('order service exposes both live and ready health probes', () => {
  const source = readSource('src', 'httpServer.ts');

  assert.match(source, /app\.get\('\/health\/live'/);
  assert.match(source, /app\.get\('\/health\/ready'/);
});
