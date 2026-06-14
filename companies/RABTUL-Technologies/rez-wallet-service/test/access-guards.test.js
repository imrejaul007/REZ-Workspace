const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readSource(...segments) {
  return fs.readFileSync(path.join(__dirname, '..', ...segments), 'utf8');
}

test('wallet internal routes apply requireInternalToken before sensitive handlers', () => {
  const source = readSource('src', 'routes', 'internalRoutes.ts');

  const guardPos = source.indexOf('router.use(requireInternalToken)');
  const creditPos = source.indexOf("router.post('/credit'");
  const debitPos = source.indexOf("router.post('/debit'");
  const merchantCreditPos = source.indexOf("router.post('/merchant/credit'");
  const reconcilePos = source.indexOf("router.get('/reconcile'");

  assert.notEqual(guardPos, -1, 'expected requireInternalToken guard');
  assert.ok(guardPos < creditPos, 'credit route must remain behind internal auth');
  assert.ok(guardPos < debitPos, 'debit route must remain behind internal auth');
  assert.ok(guardPos < merchantCreditPos, 'merchant credit route must remain behind internal auth');
  assert.ok(guardPos < reconcilePos, 'reconcile route must remain behind internal auth');
});

test('wallet internal mutation routes emit audit logs', () => {
  const source = readSource('src', 'routes', 'internalRoutes.ts');

  assert.match(source, /auditLog\(req, 'coins\.credit'/);
  assert.match(source, /auditLog\(req, 'coins\.debit'/);
  assert.match(source, /auditLog\(req, 'merchant\.credit'/);
});
