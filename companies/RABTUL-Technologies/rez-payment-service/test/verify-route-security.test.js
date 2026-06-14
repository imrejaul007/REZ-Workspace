const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('api/razorpay/verify-payment remains internal-only', () => {
  const filePath = path.join(__dirname, '..', 'src', 'routes', 'paymentRoutes.ts');
  const source = fs.readFileSync(filePath, 'utf8');

  const matches = [...source.matchAll(/^\s*router\.post\('\/api\/razorpay\/verify-payment',\s*([A-Za-z0-9_]+),\s*verifyHandler\);/gm)];

  assert.equal(matches.length, 1, 'expected exactly one /api/razorpay/verify-payment route registration');
  assert.equal(matches[0][1], 'requireInternalToken', 'verify-payment must stay behind requireInternalToken');
  assert.ok(!/^\s*router\.post\('\/api\/razorpay\/verify-payment',\s*requireAuth,\s*verifyHandler\);/m.test(source),
    'verify-payment must not be exposed with requireAuth');
});
